const express = require("express");
const { authenticate } = require("../middleware/auth");
const { handleAsync } = require("../middleware/error");
const {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
} = require("../services/userService.mongo");
const {
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  createOrUpdateSession,
} = require("../services/sessionService.mongo");
const RoutePermission = require("../models/RoutePermission");
const ApiToken = require("../models/ApiToken");
const UsageHistory = require("../models/UsageHistory");
const PaymentRequest = require("../models/PaymentRequest");
const ShopeeCookie = require("../models/ShopeeCookie");
const crypto = require("crypto");

const router = express.Router();

// GET /user/routes - Lấy danh sách routes mà user hiện tại có quyền truy cập
// Không yêu cầu authenticate, nếu không có token thì trả về routes cho role "guest"
router.get(
  "/routes",
  handleAsync(async (req, res) => {
    let userRole = "guest"; // Mặc định là guest nếu không có token

    // Thử lấy user từ token nếu có
    try {
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.replace("Bearer ", "");
        const { admin } = require("../firebase");
        const decoded = await admin.auth().verifyIdToken(idToken);
        
        // Check if user is disabled
        const userProfile = await getUserProfile(decoded.uid);
        if (userProfile && userProfile.disabled === true) {
          // Nếu user bị disabled, vẫn trả về routes cho guest
          userRole = "guest";
        } else if (userProfile) {
          userRole = userProfile.role || "user";
        }
      }
    } catch (error) {
      // Nếu token không hợp lệ hoặc không có token, dùng role guest
      userRole = "guest";
    }

    // Tìm tất cả routes mà user có quyền truy cập
    const accessibleRoutes = await RoutePermission.find({
      allowedRoles: { $in: [userRole] },
    })
      .select("path method description") // Không trả về allowedRoles để bảo mật
      .sort({ path: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        routes: accessibleRoutes,
        userRole, // Chỉ trả về role của user hiện tại, không phải roles của routes
      },
    });
  }),
);

router.use(authenticate);

router.get(
  "/me",
  handleAsync(async (req, res) => {
    let profile = await getUserProfile(req.user.uid);
    if (!profile) {
      // Tự động tạo user profile trong MongoDB nếu chưa có
      profile = await createUserProfile(req.user.uid, {
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        displayName: req.user.displayName,
        photoURL: req.user.photoURL,
      });
    }
    res.json({ success: true, data: profile });
  }),
);

router.put(
  "/me",
  handleAsync(async (req, res) => {
    const body = req.body || {};
    const validatedData = {};

    if (body.displayName !== undefined) {
      if (
        body.displayName !== null &&
        body.displayName !== "" &&
        typeof body.displayName !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error: { message: "displayName must be a string" },
        });
      }
      if (body.displayName && body.displayName.trim() !== "") {
        if (
          body.displayName.length < 1 ||
          body.displayName.length > 100
        ) {
          return res.status(400).json({
            success: false,
            error: {
              message: "displayName must be between 1 and 100 characters",
            },
          });
        }
        validatedData.displayName = body.displayName.trim();
      } else {
        validatedData.displayName = body.displayName || null;
      }
    }

    if (body.phone !== undefined) {
      if (
        body.phone !== null &&
        body.phone !== "" &&
        typeof body.phone !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error: { message: "phone must be a string" },
        });
      }
      if (
        body.phone &&
        body.phone.trim() !== "" &&
        !/^[0-9]{10,11}$/.test(body.phone.trim())
      ) {
        return res.status(400).json({
          success: false,
          error: { message: "phone must be 10-11 digits" },
        });
      }
      validatedData.phone =
        body.phone && body.phone.trim() !== ""
          ? body.phone.trim()
          : null;
    }

    if (body.dateOfBirth !== undefined) {
      if (body.dateOfBirth !== null && typeof body.dateOfBirth !== "string") {
        return res.status(400).json({
          success: false,
          error: {
            message: "dateOfBirth must be a string or null",
          },
        });
      }
      validatedData.dateOfBirth = body.dateOfBirth || null;
    }

    if (body.gender !== undefined) {
      if (
        body.gender !== null &&
        !["male", "female", "other"].includes(body.gender)
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message: "gender must be one of: male, female, other",
          },
        });
      }
      validatedData.gender = body.gender || null;
    }

    if (body.photoURL !== undefined) {
      if (typeof body.photoURL !== "string") {
        return res.status(400).json({
          success: false,
          error: { message: "photoURL must be a string" },
        });
      }
      validatedData.photoURL = body.photoURL || null;
    }

    const updatedProfile = await updateUserProfile(
      req.user.uid,
      validatedData,
    );
    res.json({ success: true, data: updatedProfile });
  }),
);

router.get(
  "/sessions",
  handleAsync(async (req, res) => {
    const sessions = await getUserSessions(req.user.uid);
    res.json({ success: true, data: sessions });
  }),
);

router.post(
  "/sessions/revoke",
  handleAsync(async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: { message: "sessionId is required" },
      });
    }
    await revokeSession(req.user.uid, sessionId);
    res.json({ success: true, message: "Session revoked successfully" });
  }),
);

router.post(
  "/sessions/revoke-others",
  handleAsync(async (req, res) => {
    const decodedToken = req.token?.decoded;
    const currentSessionId =
      decodedToken?.iat?.toString() || decodedToken?.jti;
    if (!currentSessionId) {
      return res.status(400).json({
        success: false,
        error: { message: "Cannot determine current session" },
      });
    }
    await revokeAllOtherSessions(req.user.uid, currentSessionId);
    res.json({
      success: true,
      message: "All other sessions revoked successfully",
    });
  }),
);

router.post(
  "/sessions/track",
  handleAsync(async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: { message: "sessionId is required" },
      });
    }

    let clientIP = "Unknown";
    if (req.headers["x-forwarded-for"]) {
      clientIP = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else if (req.headers["x-real-ip"]) {
      clientIP = req.headers["x-real-ip"];
    } else if (req.ip) {
      clientIP = req.ip;
    } else if (req.socket?.remoteAddress) {
      clientIP = req.socket.remoteAddress;
    }
    if (clientIP && clientIP.startsWith("::ffff:")) {
      clientIP = clientIP.replace("::ffff:", "");
    }

    const userAgent = req.headers["user-agent"] || "Unknown";
    let deviceInfo = "Unknown";
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPhone/.test(userAgent)) deviceInfo = "iPhone";
      else if (/iPad/.test(userAgent)) deviceInfo = "iPad";
      else if (/Android/.test(userAgent)) deviceInfo = "Android";
      else deviceInfo = "Mobile";
    } else if (/Windows/.test(userAgent)) deviceInfo = "Windows";
    else if (/Mac/.test(userAgent)) deviceInfo = "Mac";
    else if (/Linux/.test(userAgent)) deviceInfo = "Linux";
    else deviceInfo = "Desktop";

    await createOrUpdateSession(req.user.uid, sessionId, {
      ipAddress: clientIP,
      userAgent,
      deviceInfo,
    });
    res.json({ success: true, message: "Session tracked successfully" });
  }),
);

// GET /user/audit-logs - Lấy lịch sử đăng nhập và hoạt động của user
router.get(
  "/audit-logs",
  handleAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Lấy sessions (lịch sử đăng nhập)
    const [sessions, sessionTotal] = await Promise.all([
      getUserSessions(req.user.uid)
        .then((sessions) =>
          sessions
            .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
            .slice(skip, skip + limitNum)
        ),
      getUserSessions(req.user.uid).then((sessions) => sessions.length),
    ]);

    // Format sessions thành audit logs
    const auditLogs = sessions.map((session) => ({
      type: "LOGIN",
      timestamp: session.lastActive || session.createdAt,
      device: session.deviceInfo || "Unknown",
      ip: session.ipAddress || "Unknown",
      userAgent: session.userAgent || "Unknown",
      isActive: session.isActive,
      sessionId: session.sessionId,
    }));

    res.json({
      success: true,
      data: {
        logs: auditLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: sessionTotal,
          pages: Math.ceil(sessionTotal / limitNum),
        },
      },
    });
  }),
);

// GET /user/transactions - Lấy lịch sử giao dịch của user
const { getUserTransactions, getUserTotalDeposit } = require("../services/transactionService");
const Transaction = require("../models/Transaction");

router.get(
  "/transactions",
  handleAsync(async (req, res) => {
    const { page = 1, limit = 20, transferType, status } = req.query;

    const result = await getUserTransactions(req.user.uid, {
      page,
      limit,
      transferType,
      status,
    });

    res.json({
      success: true,
      data: result,
    });
  }),
);

// GET /user/wallet/summary - Lấy thông tin tổng quan về ví
router.get(
  "/wallet/summary",
  handleAsync(async (req, res) => {
    const userProfile = await getUserProfile(req.user.uid);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: "Không tìm thấy thông tin người dùng" },
      });
    }

    const totalDeposit = await getUserTotalDeposit(req.user.uid);

    // Lấy giao dịch gần nhất
    const recentTransactions = await Transaction.find({
      userId: req.user.uid,
      transferType: "in",
      status: "processed",
    })
      .select('-content') // Loại bỏ field content khỏi response
      .sort({ transactionDate: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        currentBalance: userProfile.walletBalance || 0,
        totalDeposit,
        recentTransactions,
      },
    });
  }),
);

// GET /user/dashboard/stats - Lấy thống kê tổng quan cho Dashboard
router.get(
  "/dashboard/stats",
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: "Không tìm thấy thông tin người dùng" },
      });
    }

    // Tổng số dư hiện tại
    const currentBalance = userProfile.walletBalance || 0;

    // Tổng đã nạp
    const totalDeposit = await getUserTotalDeposit(userId);

    // Tổng đã rút (từ transactions với transferType = 'out')
    const totalWithdrawResult = await Transaction.aggregate([
      {
        $match: {
          userId,
          transferType: 'out',
          status: 'processed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountOut' },
        },
      },
    ]);
    const totalWithdraw = totalWithdrawResult.length > 0 ? totalWithdrawResult[0].total : 0;

    // Tổng đã sử dụng (từ UsageHistory, amount luôn là số âm)
    const totalUsageResult = await UsageHistory.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$amount' } }, // Lấy giá trị tuyệt đối vì amount là số âm
        },
      },
    ]);
    const totalUsage = totalUsageResult.length > 0 ? totalUsageResult[0].total : 0;

    res.json({
      success: true,
      data: {
        currentBalance,
        totalDeposit,
        totalWithdraw,
        totalUsage,
      },
    });
  }),
);

// GET /user/dashboard/activities - Lấy hoạt động gần đây
router.get(
  "/dashboard/activities",
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;

    // Lấy giao dịch gần nhất (nạp/rút)
    const recentTransactions = await Transaction.find({
      userId,
      status: 'processed',
    })
      .select('-content')
      .sort({ transactionDate: -1 })
      .limit(limit)
      .lean();

    // Lấy lịch sử sử dụng gần nhất
    const recentUsage = await UsageHistory.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Gộp và sắp xếp theo thời gian
    const activities = [
      ...recentTransactions.map((t) => ({
        type: 'transaction',
        id: t._id.toString(),
        title: t.transferType === 'in' ? 'Nạp tiền' : 'Rút tiền',
        amount: t.transferType === 'in' ? t.amountIn : -t.amountOut,
        description: t.description || t.referenceCode || '',
        date: t.transactionDate,
        timestamp: new Date(t.transactionDate).getTime(),
      })),
      ...recentUsage.map((u) => ({
        type: 'usage',
        id: u._id.toString(),
        title: u.service,
        amount: u.amount, // Đã là số âm
        description: u.metadata?.message || u.metadata?.phone || '',
        date: u.createdAt,
        timestamp: new Date(u.createdAt).getTime(),
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        activities,
      },
    });
  }),
);

// ========== API Token Management ==========

/**
 * Generate unique API token
 */
function generateApiToken() {
  // Format: autopee_ + random 32 bytes base64url encoded
  const randomBytes = crypto.randomBytes(32);
  const token = `autopee_${randomBytes.toString("base64url")}`;
  return token;
}

// GET /user/api-tokens - Lấy danh sách API tokens của user
router.get(
  "/api-tokens",
  handleAsync(async (req, res) => {
    const tokens = await ApiToken.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .lean();

    // Không trả về token đầy đủ, chỉ trả về prefix để hiển thị
    const tokensWithMaskedToken = tokens.map((token) => ({
      ...token,
      token: token.token.substring(0, 20) + "..." + token.token.substring(token.token.length - 4),
      fullToken: token.token, // Chỉ trả về khi tạo mới
    }));

    res.json({ success: true, data: tokensWithMaskedToken });
  }),
);

// POST /user/api-tokens - Tạo API token mới
router.post(
  "/api-tokens",
  handleAsync(async (req, res) => {
    const { name } = req.body;

    // Tạo token mới
    const token = generateApiToken();

    const apiToken = await ApiToken.create({
      userId: req.user.uid,
      token,
      name: name || "Default Token",
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        ...apiToken.toObject(),
        // Trả về full token chỉ khi tạo mới
        fullToken: token,
      },
    });
  }),
);

// PUT /user/api-tokens/:id - Cập nhật token (name, isActive)
router.put(
  "/api-tokens/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (isActive !== undefined) update.isActive = isActive;

    const token = await ApiToken.findOneAndUpdate(
      { _id: id, userId: req.user.uid },
      update,
      { new: true }
    ).lean();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: { message: "Token không tồn tại" },
      });
    }

    // Mask token
    token.token = token.token.substring(0, 20) + "..." + token.token.substring(token.token.length - 4);

    res.json({ success: true, data: token });
  }),
);

// DELETE /user/api-tokens/:id - Xóa token
router.delete(
  "/api-tokens/:id",
  handleAsync(async (req, res) => {
    const { id } = req.params;

    const token = await ApiToken.findOneAndDelete({
      _id: id,
      userId: req.user.uid,
    }).lean();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: { message: "Token không tồn tại" },
      });
    }

    res.json({ success: true, message: "Token đã được xóa" });
  }),
);

// GET /user/api-tokens/:id/usage - Lấy thống kê sử dụng token
router.get(
  "/api-tokens/:id/usage",
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const { month } = req.query; // Format: "YYYY-MM"

    const token = await ApiToken.findOne({
      _id: id,
      userId: req.user.uid,
    }).lean();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: { message: "Token không tồn tại" },
      });
    }

    let usageData = token.monthlyUsage || [];
    if (month) {
      usageData = usageData.filter((u) => u.month === month);
    }

    res.json({
      success: true,
      data: {
        totalUsage: token.usageCount || 0,
        lastUsedAt: token.lastUsedAt,
        monthlyUsage: usageData,
      },
    });
  }),
);

// ========== Usage History ==========

// GET /user/usage-history - Lấy lịch sử sử dụng tiền trong 7 ngày gần nhất
router.get(
  "/usage-history",
  handleAsync(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Lấy 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const query = {
      userId: req.user.uid,
      createdAt: { $gte: sevenDaysAgo },
    };

    const [history, total] = await Promise.all([
      UsageHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UsageHistory.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        history,
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

module.exports = router;


