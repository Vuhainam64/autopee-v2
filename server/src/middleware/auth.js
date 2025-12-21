const { admin } = require("../firebase");
const { getUserProfile } = require("../services/userService.mongo");
const ApiToken = require("../models/ApiToken");

/**
 * Verify Bearer token and attach decoded user + token info to request
 * Supports both Firebase ID tokens and API tokens
 * Also checks if user is disabled in MongoDB
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Check if it's an API token (starts with "autopee_")
    if (token.startsWith("autopee_")) {
      // Verify API token - tìm theo full token trong database
      const apiToken = await ApiToken.findOne({ 
        token: token, // Token trong DB là full token
        isActive: true 
      }).lean();
      
      if (!apiToken) {
        // Thử tìm xem token có tồn tại nhưng inactive không
        const inactiveToken = await ApiToken.findOne({ token: token }).lean();
        if (inactiveToken) {
          console.log(`[Auth] API token found but inactive: ${token.substring(0, 20)}...`);
          return res.status(401).json({ error: "Token has been deactivated" });
        }
        console.log(`[Auth] API token not found: ${token.substring(0, 30)}...`);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      
      // Check if user is disabled
      const userProfile = await getUserProfile(apiToken.userId);
      if (userProfile && userProfile.disabled === true) {
        return res.status(403).json({ 
          error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." 
        });
      }
      
      // Update usage statistics (async, không block request)
      ApiToken.updateOne(
        { _id: apiToken._id },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date() },
        }
      ).catch((err) => {
        console.error("Error updating API token usage:", err);
      });
      
      req.user = {
        uid: apiToken.userId,
        email: userProfile?.email || null,
        emailVerified: userProfile?.emailVerified || false,
      };
      req.token = { raw: token, type: "api_token", apiTokenId: apiToken._id };
      return next();
    }
    
    // Otherwise, treat as Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token);
    
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
    req.token = { raw: token, decoded, type: "firebase_id_token" };
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Auth verification failed", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticate };


