const ApiPermission = require("../models/ApiPermission");
const { getUserProfile } = require("../services/userService.mongo");

/**
 * Middleware để kiểm tra quyền truy cập API dựa trên permissions trong database
 * @param {string} endpoint - Endpoint pattern (có thể có :id, :uid, etc.)
 * @param {string} method - HTTP method
 */
const checkApiPermission = (endpoint, method = "GET") => {
  return async (req, res, next) => {
    try {
      // Lấy user profile để check role
      const userProfile = await getUserProfile(req.user.uid);
      if (!userProfile) {
        return res.status(403).json({
          success: false,
          error: { message: "Không tìm thấy thông tin người dùng" },
        });
      }

      const userRole = userProfile.role || "user";

      // Tìm permission trong database
      // Cần match endpoint pattern với actual endpoint
      const actualEndpoint = req.path;
      const actualMethod = req.method;

      // Tìm exact match trước
      let permission = await ApiPermission.findOne({
        endpoint: actualEndpoint,
        method: actualMethod,
      }).lean();

      // Nếu không tìm thấy exact match, thử match với pattern (có :id, :uid, etc.)
      if (!permission) {
        // Convert endpoint pattern thành regex
        // Ví dụ: /admin/routes/:id -> /admin/routes/.*
        const patternRegex = new RegExp(
          "^" + endpoint.replace(/:[^/]+/g, "[^/]+") + "$"
        );
        permission = await ApiPermission.findOne({
          endpoint: { $regex: patternRegex },
          method: actualMethod,
        }).lean();
      }

      // Nếu vẫn không tìm thấy, thử tìm với endpoint pattern từ parameter
      if (!permission && endpoint) {
        const patternRegex = new RegExp(
          "^" + endpoint.replace(/:[^/]+/g, "[^/]+") + "$"
        );
        permission = await ApiPermission.findOne({
          endpoint: { $regex: patternRegex },
          method: actualMethod,
        }).lean();
      }

      // Nếu không có permission trong DB, deny by default
      if (!permission) {
        return res.status(403).json({
          success: false,
          error: { message: "Không có quyền truy cập API này" },
        });
      }

      // Kiểm tra role có trong allowedRoles không
      if (!permission.allowedRoles || !permission.allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Chỉ ${permission.allowedRoles.join(", ")} mới có quyền truy cập`,
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
  };
};

module.exports = { checkApiPermission };

