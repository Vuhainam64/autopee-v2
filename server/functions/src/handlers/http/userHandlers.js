/**
 * HTTP Handlers for User endpoints
 */

const {verifyToken, handleHTTPErrors} = require("../../middleware");
const {getUserProfile, updateUserProfile} = require("../../services/userService");
const {
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
} = require("../../services/sessionService");
const logger = require("../../utils/logger");

const withCors = (handler) => async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  return handler(req, res);
};

/**
 * Get current user profile
 * GET /getCurrentUser
 */
exports.getCurrentUser = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "GET") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const user = await verifyToken(req);
      let profile = await getUserProfile(user.uid);

      // If profile doesn't exist, return basic user info
      if (!profile) {
        profile = {
          id: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.email?.split("@")[0] || "",
        };
      }

      res.json({success: true, data: profile});
    }),
);

/**
 * Update user profile
 * PUT /updateCurrentUser
 */
exports.updateCurrentUser = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "PUT") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const user = await verifyToken(req);

      // Validate only provided fields
      const body = req.body || {};
      const validatedData = {};

      if (body.displayName !== undefined) {
        // Allow empty string to clear the field, or valid string
        if (body.displayName !== null && body.displayName !== "" &&
            typeof body.displayName !== "string") {
          return res.status(400).json({
            success: false,
            error: {message: "displayName must be a string"},
          });
        }
        // Validate length only if provided and not empty
        if (body.displayName && body.displayName.trim() !== "") {
          if (body.displayName.length < 1 || body.displayName.length > 100) {
            return res.status(400).json({
              success: false,
              error: {message: "displayName must be between 1 and 100 characters"},
            });
          }
          validatedData.displayName = body.displayName.trim();
        } else {
        // Allow clearing the field
          validatedData.displayName = body.displayName || null;
        }
      }

      if (body.phone !== undefined) {
      // Allow empty string, null, or valid phone number
        if (body.phone !== null && body.phone !== "" && typeof body.phone !== "string") {
          return res.status(400).json({
            success: false,
            error: {message: "phone must be a string"},
          });
        }
        // Validate phone format only if provided and not empty
        if (body.phone && body.phone.trim() !== "" && !/^[0-9]{10,11}$/.test(body.phone.trim())) {
          return res.status(400).json({
            success: false,
            error: {message: "phone must be 10-11 digits"},
          });
        }
        // Convert empty string to null
        validatedData.phone = body.phone && body.phone.trim() !== "" ? body.phone.trim() : null;
      }

      if (body.dateOfBirth !== undefined) {
        if (body.dateOfBirth !== null && typeof body.dateOfBirth !== "string") {
          return res.status(400).json({
            success: false,
            error: {message: "dateOfBirth must be a string or null"},
          });
        }
        validatedData.dateOfBirth = body.dateOfBirth || null;
      }

      if (body.gender !== undefined) {
        if (body.gender !== null && !["male", "female", "other"].includes(body.gender)) {
          return res.status(400).json({
            success: false,
            error: {message: "gender must be one of: male, female, other"},
          });
        }
        validatedData.gender = body.gender || null;
      }

      if (body.photoURL !== undefined) {
        if (typeof body.photoURL !== "string") {
          return res.status(400).json({
            success: false,
            error: {message: "photoURL must be a string"},
          });
        }
        validatedData.photoURL = body.photoURL || null;
      }

      const updatedProfile = await updateUserProfile(user.uid, validatedData);

      logger.info("User profile updated", {
        uid: user.uid,
        updatedFields: Object.keys(validatedData),
      });
      res.json({success: true, data: updatedProfile});
    }),
);

/**
 * Get user active sessions
 * GET /getUserSessions
 */
exports.getUserSessions = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "GET") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const user = await verifyToken(req);
      const sessions = await getUserSessions(user.uid);

      res.json({success: true, data: sessions});
    }),
);

/**
 * Revoke a specific session
 * POST /revokeSession
 */
exports.revokeSession = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const user = await verifyToken(req);
      const {sessionId} = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: {message: "sessionId is required"},
        });
      }

      await revokeSession(user.uid, sessionId);

      res.json({success: true, message: "Session revoked successfully"});
    }),
);

/**
 * Revoke all other sessions (except current)
 * POST /revokeAllOtherSessions
 */
exports.revokeAllOtherSessions = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const user = await verifyToken(req);
      const token = req.headers.authorization?.split("Bearer ")[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          error: {message: "Token is required"},
        });
      }

      // Decode token to get session ID (use iat as session identifier)
      const {auth} = require("../../config");
      const decodedToken = await auth.verifyIdToken(token);
      const currentSessionId = decodedToken.iat?.toString() || decodedToken.jti;

      await revokeAllOtherSessions(user.uid, currentSessionId);

      res.json({success: true, message: "All other sessions revoked successfully"});
    }),
);

/**
 * Track user session (called after login)
 * POST /trackSession
 */
exports.trackSession = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const user = await verifyToken(req);
      const {sessionId} = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: {message: "sessionId is required"},
        });
      }

      // Get IP address from request (server-side, cannot be spoofed)
      // Firebase Cloud Functions v1 uses Express request object
      let clientIP = "Unknown";

      // Try multiple methods to get IP
      // Priority: x-forwarded-for > x-real-ip > req.ip > socket.remoteAddress > req.raw
      if (req.headers["x-forwarded-for"]) {
        const forwarded = req.headers["x-forwarded-for"];
        clientIP = forwarded.split(",")[0].trim();
      } else if (req.headers["x-real-ip"]) {
        clientIP = req.headers["x-real-ip"];
      } else if (req.ip) {
        clientIP = req.ip;
      } else if (req.socket && req.socket.remoteAddress) {
        clientIP = req.socket.remoteAddress;
      } else if (req.connection && req.connection.remoteAddress) {
        clientIP = req.connection.remoteAddress;
      } else if (req.raw && req.raw.socket && req.raw.socket.remoteAddress) {
        clientIP = req.raw.socket.remoteAddress;
      } else if (req.raw && req.raw.connection && req.raw.connection.remoteAddress) {
        clientIP = req.raw.connection.remoteAddress;
      }

      if (clientIP && clientIP.startsWith("::ffff:")) {
        clientIP = clientIP.replace("::ffff:", "");
      }

      if (clientIP === "Unknown") {
        const debugInfo = {
          headers: Object.keys(req.headers),
          hasSocket: !!req.socket,
          hasConnection: !!req.connection,
          hasRaw: !!req.raw,
          socketKeys: req.socket ? Object.keys(req.socket) : [],
          connectionKeys: req.connection ? Object.keys(req.connection) : [],
          rawKeys: req.raw ? Object.keys(req.raw) : [],
        };
        logger.warn("Could not determine client IP", debugInfo);
      }

      logger.info("Session tracking", {
        userId: user.uid,
        sessionId,
        clientIP,
        userAgent: req.headers["user-agent"],
        hasXForwardedFor: !!req.headers["x-forwarded-for"],
        hasXRealIp: !!req.headers["x-real-ip"],
        reqIp: req.ip,
        socketRemoteAddress: req.socket?.remoteAddress,
        rawSocketRemoteAddress: req.raw?.socket?.remoteAddress,
      });

      const userAgent = req.headers["user-agent"] || "Unknown";

      let deviceInfo = "Unknown";
      if (userAgent) {
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
          if (/iPhone/.test(userAgent)) {
            deviceInfo = "iPhone";
          } else if (/iPad/.test(userAgent)) {
            deviceInfo = "iPad";
          } else if (/Android/.test(userAgent)) {
            deviceInfo = "Android";
          } else {
            deviceInfo = "Mobile";
          }
        } else if (/Windows/.test(userAgent)) {
          deviceInfo = "Windows";
        } else if (/Mac/.test(userAgent)) {
          deviceInfo = "Mac";
        } else if (/Linux/.test(userAgent)) {
          deviceInfo = "Linux";
        } else {
          deviceInfo = "Desktop";
        }
      }

      const {createOrUpdateSession} = require("../../services/sessionService");

      await createOrUpdateSession(user.uid, sessionId, {
        ipAddress: clientIP,
        userAgent: userAgent,
        deviceInfo: deviceInfo,
      });

      res.json({success: true, message: "Session tracked successfully"});
    }),
);

