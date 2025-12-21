const { admin } = require("../firebase");
const { getUserProfile } = require("../services/userService.mongo");

/**
 * Verify Bearer token and attach decoded user + token info to request
 * Also checks if user is disabled in MongoDB
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // Check if user is disabled in MongoDB
    const userProfile = await getUserProfile(decoded.uid);
    if (userProfile && userProfile.disabled === true) {
      return res.status(403).json({ 
        error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." 
      });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
    };
    req.token = { raw: idToken, decoded };
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Auth verification failed", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticate };


