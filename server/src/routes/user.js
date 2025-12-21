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

const router = express.Router();

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

// GET /user/routes - Lấy danh sách routes mà user hiện tại có quyền truy cập
router.get(
  "/routes",
  handleAsync(async (req, res) => {
    // Lấy user profile để lấy role
    const userProfile = await getUserProfile(req.user.uid);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: "Không tìm thấy thông tin người dùng" },
      });
    }

    const userRole = userProfile.role || "user";

    // Tìm tất cả routes mà user có quyền truy cập
    const accessibleRoutes = await RoutePermission.find({
      allowedRoles: { $in: [userRole] },
    })
      .select("path method description allowedRoles")
      .sort({ path: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        routes: accessibleRoutes,
        userRole,
      },
    });
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

module.exports = router;


