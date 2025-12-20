const { admin } = require("../firebase");

/**
 * Verify Bearer token and attach decoded user + token info to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(idToken);
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


