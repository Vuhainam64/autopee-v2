const express = require("express");
const { authenticate } = require("../middleware/auth");
const { handleAsync } = require("../middleware/error");
const RoutePermission = require("../models/RoutePermission");
const ApiPermission = require("../models/ApiPermission");
const PermissionHistory = require("../models/PermissionHistory");
const Role = require("../models/Role");
const User = require("../models/User");
const ServerLog = require("../models/ServerLog");
const { getUserProfile } = require("../services/userService.mongo");

const router = express.Router();

router.use(authenticate);

// Middleware tự động kiểm tra quyền truy cập API dựa trên permissions trong database
// Áp dụng cho tất cả routes trong admin router
router.use(async (req, res, next) => {
  try {
    const userProfile = await getUserProfile(req.user.uid);
    if (!userProfile) {
      return res.status(403).json({
        success: false,
        error: { message: "Không tìm thấy thông tin người dùng" },
      });
    }

    const userRole = userProfile.role || "user";
    const actualMethod = req.method;
    
    // Lấy path thực tế từ request
    // req.path trong router đã bỏ prefix /admin (vì đã mount ở /admin)
    // Ví dụ: req.path = "/routes" hoặc "/routes/123" hoặc "/users/abc/role"
    const routePath = req.path;
    
    // Build các patterns để tìm trong DB
    // Endpoints trong DB có format: /api/admin/routes hoặc /admin/routes
    const searchPatterns = [
      `/api/admin${routePath}`,  // /api/admin/routes
      `/admin${routePath}`,       // /admin/routes
    ];
    
    // Tìm permission trong database
    let permission = null;
    
    // Bước 1: Thử exact match với các patterns
    for (const pattern of searchPatterns) {
      permission = await ApiPermission.findOne({
        endpoint: pattern,
        method: actualMethod,
      }).lean();
      if (permission) break;
    }

    // Bước 2: Nếu không tìm thấy exact match, thử match với dynamic patterns (có :id, :uid, etc.)
    if (!permission) {
      // Lấy tất cả permissions có cùng method
      const allPermissions = await ApiPermission.find({
        method: actualMethod,
      }).lean();
      
      for (const perm of allPermissions) {
        // Convert DB endpoint pattern thành regex
        // Ví dụ: /api/admin/routes/:id -> ^/api/admin/routes/[^/]+$
        const dbPatternRegex = new RegExp(
          "^" + perm.endpoint.replace(/:[^/]+/g, "[^/]+") + "$"
        );
        
        // Test với các search patterns
        for (const pattern of searchPatterns) {
          if (dbPatternRegex.test(pattern)) {
            permission = perm;
            break;
          }
        }
        if (permission) break;
      }
    }

    // Nếu không có permission trong DB, deny by default
    if (!permission) {
      console.warn(`No permission found for: ${actualMethod} ${routePath} (searched: ${searchPatterns.join(", ")})`);
      return res.status(403).json({
        success: false,
        error: { message: "Không có quyền truy cập API này" },
      });
    }

    // Kiểm tra role có trong allowedRoles không
    if (!permission.allowedRoles || !permission.allowedRoles.includes(userRole)) {
      const allowedRolesDisplay = permission.allowedRoles.join(", ");
      
      return res.status(403).json({
        success: false,
        error: {
          message: `Chỉ ${allowedRolesDisplay} mới có quyền truy cập`,
        },
      });
    }

    // Có quyền, cho phép tiếp tục
    next();
  } catch (error) {
    console.error("Permission check failed:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Lỗi kiểm tra quyền" },
    });
  }
});

// ========== Route Permissions ==========

// GET /admin/routes - Lấy danh sách route permissions
router.get(
  "/routes",
  handleAsync(async (req, res) => {
    const routes = await RoutePermission.find().sort({ path: 1 }).lean();
    res.json({ success: true, data: routes });
  }),
);

// POST /admin/routes - Tạo route permission mới
router.post(
  "/routes",
  handleAsync(async (req, res) => {
    const { path, method, allowedRoles, description } = req.body;

    if (!path || !allowedRoles || !Array.isArray(allowedRoles)) {
      return res.status(400).json({
        success: false,
        error: { message: "path và allowedRoles là bắt buộc" },
      });
    }

    const route = await RoutePermission.create({
      path,
      method: method || "GET",
      allowedRoles,
      description,
    });

    // Log history
    const userProfile = await getUserProfile(req.user.uid);
    await PermissionHistory.create({
      type: "route",
      permissionId: route._id,
      action: "create",
      changedBy: req.user.uid,
      changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
      newData: route.toObject(),
      description: `Tạo route mới: ${path}`,
    });

    res.json({ success: true, data: route });
  }),
);

// PUT /admin/routes/bulk - Bulk update route permissions (phải đặt TRƯỚC /:id)
router.put(
  "/routes/bulk",
  handleAsync(async (req, res) => {
    const { ids, allowedRoles } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "ids là bắt buộc và phải là array" },
      });
    }

    if (!allowedRoles || !Array.isArray(allowedRoles)) {
      return res.status(400).json({
        success: false,
        error: { message: "allowedRoles là bắt buộc" },
      });
    }

    const userProfile = await getUserProfile(req.user.uid);
    const updatedRoutes = [];

    for (const id of ids) {
      const oldRoute = await RoutePermission.findById(id).lean();
      if (oldRoute) {
        const updated = await RoutePermission.findByIdAndUpdate(
          id,
          { $set: { allowedRoles } },
          { new: true }
        ).lean();

        // Log history for each update
        await PermissionHistory.create({
          type: "route",
          permissionId: id,
          action: "update",
          changedBy: req.user.uid,
          changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
          oldData: oldRoute,
          newData: updated,
          description: `Bulk update route: ${updated.path}`,
        });

        updatedRoutes.push(updated);
      }
    }

    res.json({
      success: true,
      message: `Đã cập nhật ${updatedRoutes.length} routes`,
      data: updatedRoutes,
    });
  }),
);

// PUT /admin/routes/:id - Cập nhật route permission
router.put(
  "/routes/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const { path, method, allowedRoles, description } = req.body;

    const update = {};
    if (path) update.path = path;
    if (method) update.method = method;
    if (allowedRoles) update.allowedRoles = allowedRoles;
    if (description !== undefined) update.description = description;

    const oldRoute = await RoutePermission.findById(id).lean();
    if (!oldRoute) {
      return res.status(404).json({
        success: false,
        error: { message: "Route không tồn tại" },
      });
    }

    const route = await RoutePermission.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    // Log history
    const userProfile = await getUserProfile(req.user.uid);
    await PermissionHistory.create({
      type: "route",
      permissionId: route._id,
      action: "update",
      changedBy: req.user.uid,
      changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
      oldData: oldRoute,
      newData: route,
      description: `Cập nhật route: ${route.path}`,
    });

    res.json({ success: true, data: route });
  }),
);

// DELETE /admin/routes/:id - Xóa route permission
router.delete(
  "/routes/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const route = await RoutePermission.findByIdAndDelete(id).lean();

    if (!route) {
      return res.status(404).json({
        success: false,
        error: { message: "Route không tồn tại" },
      });
    }

    // Log history
    const userProfile = await getUserProfile(req.user.uid);
    await PermissionHistory.create({
      type: "route",
      permissionId: route._id,
      action: "delete",
      changedBy: req.user.uid,
      changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
      oldData: route,
      description: `Xóa route: ${route.path}`,
    });

    res.json({ success: true, message: "Route đã được xóa" });
  }),
);

// ========== API Permissions ==========

// GET /admin/apis - Lấy danh sách API permissions
router.get(
  "/apis",
  handleAsync(async (req, res) => {
    const apis = await ApiPermission.find().sort({ endpoint: 1 }).lean();
    res.json({ success: true, data: apis });
  }),
);

// POST /admin/apis - Tạo API permission mới
router.post(
  "/apis",
  handleAsync(async (req, res) => {
    const { endpoint, method, allowedRoles, description } = req.body;

    if (!endpoint || !allowedRoles || !Array.isArray(allowedRoles)) {
      return res.status(400).json({
        success: false,
        error: { message: "endpoint và allowedRoles là bắt buộc" },
      });
    }

    const api = await ApiPermission.create({
      endpoint,
      method: method || "GET",
      allowedRoles,
      description,
    });

    // Log history
    const userProfile = await getUserProfile(req.user.uid);
    await PermissionHistory.create({
      type: "api",
      permissionId: api._id,
      action: "create",
      changedBy: req.user.uid,
      changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
      newData: api.toObject(),
      description: `Tạo API mới: ${endpoint}`,
    });

    res.json({ success: true, data: api });
  }),
);

// PUT /admin/apis/bulk - Bulk update API permissions (phải đặt TRƯỚC /:id)
router.put(
  "/apis/bulk",
  handleAsync(async (req, res) => {
    const { ids, allowedRoles } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "ids là bắt buộc và phải là array" },
      });
    }

    if (!allowedRoles || !Array.isArray(allowedRoles)) {
      return res.status(400).json({
        success: false,
        error: { message: "allowedRoles là bắt buộc" },
      });
    }

    const userProfile = await getUserProfile(req.user.uid);
    const updatedApis = [];

    for (const id of ids) {
      const oldApi = await ApiPermission.findById(id).lean();
      if (oldApi) {
        const updated = await ApiPermission.findByIdAndUpdate(
          id,
          { $set: { allowedRoles } },
          { new: true }
        ).lean();

        // Log history for each update
        await PermissionHistory.create({
          type: "api",
          permissionId: id,
          action: "update",
          changedBy: req.user.uid,
          changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
          oldData: oldApi,
          newData: updated,
          description: `Bulk update API: ${updated.endpoint}`,
        });

        updatedApis.push(updated);
      }
    }

    res.json({
      success: true,
      message: `Đã cập nhật ${updatedApis.length} APIs`,
      data: updatedApis,
    });
  }),
);

// PUT /admin/apis/:id - Cập nhật API permission
router.put(
  "/apis/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const { endpoint, method, allowedRoles, description } = req.body;

    const update = {};
    if (endpoint) update.endpoint = endpoint;
    if (method) update.method = method;
    if (allowedRoles) update.allowedRoles = allowedRoles;
    if (description !== undefined) update.description = description;

    const oldApi = await ApiPermission.findById(id).lean();
    if (!oldApi) {
      return res.status(404).json({
        success: false,
        error: { message: "API không tồn tại" },
      });
    }

    const api = await ApiPermission.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    // Log history
    const userProfile = await getUserProfile(req.user.uid);
    await PermissionHistory.create({
      type: "api",
      permissionId: api._id,
      action: "update",
      changedBy: req.user.uid,
      changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
      oldData: oldApi,
      newData: api,
      description: `Cập nhật API: ${api.endpoint}`,
    });

    res.json({ success: true, data: api });
  }),
);

// DELETE /admin/apis/:id - Xóa API permission
router.delete(
  "/apis/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const api = await ApiPermission.findByIdAndDelete(id).lean();

    if (!api) {
      return res.status(404).json({
        success: false,
        error: { message: "API không tồn tại" },
      });
    }

    // Log history
    const userProfile = await getUserProfile(req.user.uid);
    await PermissionHistory.create({
      type: "api",
      permissionId: api._id,
      action: "delete",
      changedBy: req.user.uid,
      changedByName: userProfile?.displayName || userProfile?.email || req.user.email,
      oldData: api,
      description: `Xóa API: ${api.endpoint}`,
    });

    res.json({ success: true, message: "API đã được xóa" });
  }),
);

// ========== Permission History ==========

// GET /admin/history - Lấy lịch sử chỉnh sửa permissions
router.get(
  "/history",
  handleAsync(async (req, res) => {
    const { limit = 100, type } = req.query;
    const query = {};
    if (type) query.type = type;

    const history = await PermissionHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: history });
  }),
);

// ========== Roles Management ==========

// GET /admin/roles - Lấy danh sách roles (sắp xếp theo score)
router.get(
  "/roles",
  handleAsync(async (req, res) => {
    const roles = await Role.find().sort({ score: 1 }).lean();
    res.json({ success: true, data: roles });
  }),
);

// POST /admin/roles - Tạo role mới
router.post(
  "/roles",
  handleAsync(async (req, res) => {
    const { name, displayName, score, description, color } = req.body;

    if (!name || !displayName || score === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: "name, displayName và score là bắt buộc" },
      });
    }

    const role = await Role.create({
      name: name.toLowerCase(),
      displayName,
      score: parseInt(score),
      description,
      color: color || "default",
    });

    res.json({ success: true, data: role });
  }),
);

// PUT /admin/roles/:id - Cập nhật role
router.put(
  "/roles/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const { name, displayName, score, description, color } = req.body;

    const update = {};
    if (name) update.name = name.toLowerCase();
    if (displayName) update.displayName = displayName;
    if (score !== undefined) update.score = parseInt(score);
    if (description !== undefined) update.description = description;
    if (color !== undefined) update.color = color;

    const role = await Role.findByIdAndUpdate(id, update, { new: true });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: { message: "Role không tồn tại" },
      });
    }

    res.json({ success: true, data: role });
  }),
);

// DELETE /admin/roles/:id - Xóa role
router.delete(
  "/roles/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: { message: "Role không tồn tại" },
      });
    }

    res.json({ success: true, message: "Role đã được xóa" });
  }),
);

// ========== Users Management ==========

// GET /admin/users - Lấy danh sách users
router.get(
  "/users",
  handleAsync(async (req, res) => {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { uid: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  }),
);

// PUT /admin/users/:uid/role - Cập nhật role cho user
router.put(
  "/users/:uid/role",
  handleAsync(async (req, res) => {
    const { uid } = req.params;
    const { role: newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({
        success: false,
        error: { message: "role là bắt buộc" },
      });
    }

    // Verify role exists
    const newRoleDoc = await Role.findOne({ name: newRole.toLowerCase() });
    if (!newRoleDoc) {
      return res.status(400).json({
        success: false,
        error: { message: "Role không tồn tại" },
      });
    }

    // Kiểm tra user không thể tự update role của mình thành role cao hơn
    if (uid === req.user.uid) {
      // Lấy role hiện tại của user đang thực hiện action
      const currentUserProfile = await getUserProfile(req.user.uid);
      if (!currentUserProfile) {
        return res.status(404).json({
          success: false,
          error: { message: "Không tìm thấy thông tin người dùng" },
        });
      }

      const currentUserRole = await Role.findOne({ name: currentUserProfile.role?.toLowerCase() });
      if (!currentUserRole) {
        return res.status(500).json({
          success: false,
          error: { message: "Không tìm thấy thông tin role hiện tại" },
        });
      }

      // So sánh score: nếu role mới có score cao hơn role hiện tại, từ chối
      if (newRoleDoc.score > currentUserRole.score) {
        return res.status(403).json({
          success: false,
          error: {
            message: "Bạn không thể tự nâng cấp quyền của mình lên cao hơn quyền hiện tại",
          },
        });
      }
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { role: newRole.toLowerCase() } },
      { new: true, upsert: false }
    ).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User không tồn tại" },
      });
    }

    res.json({ success: true, data: user });
  }),
);

// PUT /admin/users/:uid/status - Cập nhật trạng thái disabled cho user
router.put(
  "/users/:uid/status",
  handleAsync(async (req, res) => {
    const { uid } = req.params;
    const { disabled } = req.body;

    if (typeof disabled !== "boolean") {
      return res.status(400).json({
        success: false,
        error: { message: "disabled phải là boolean" },
      });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { disabled } },
      { new: true, upsert: false }
    ).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User không tồn tại" },
      });
    }

    res.json({ success: true, data: user });
  }),
);

// GET /admin/logs - Lấy danh sách server logs
router.get(
  "/logs",
  handleAsync(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      level,
      userId,
      endpoint,
      traceId,
      errorCode,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (level) {
      query.level = level;
    }

    if (userId) {
      query.userId = userId;
    }

    if (endpoint) {
      query.endpoint = { $regex: endpoint, $options: "i" };
    }

    if (traceId) {
      query.traceId = traceId;
    }

    if (errorCode) {
      query.errorCode = errorCode;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { endpoint: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch logs
    const [logs, total] = await Promise.all([
      ServerLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ServerLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  }),
);

// POST /admin/logs/client - Client gửi error logs từ frontend
router.post(
  "/logs/client",
  handleAsync(async (req, res) => {
    const {
      message,
      url,
      line,
      column,
      stack,
      userAgent,
      timestamp,
      metadata = {},
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        errorCode: "VALIDATION_ERROR",
        error: { message: "message là bắt buộc" },
      });
    }

    // Tạo traceId cho client error
    const traceId = req.traceId || `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await ServerLog.create({
      level: "client_error",
      message: `[CLIENT] ${message}`,
      service: "autopee-api",
      traceId,
      errorCode: "CLIENT_ERROR",
      userId: req.user?.uid || null,
      endpoint: url || null,
      method: "CLIENT",
      ip: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      userAgent: userAgent || req.headers["user-agent"] || null,
      metadata: {
        url,
        line,
        column,
        stack,
        timestamp: timestamp || new Date(),
        ...metadata,
      },
    });

    res.json({
      success: true,
      traceId,
      message: "Client error đã được ghi log",
    });
  }),
);

module.exports = router;

