const {db, auth} = require("../firebase");
const logger = require("../utils/logger");

const createOrUpdateSession = async (userId, sessionId, sessionData) => {
  try {
    const sessionRef = db.collection("userSessions").doc(`${userId}_${sessionId}`);
    const sessionDoc = await sessionRef.get();
    const sessionInfo = {
      userId,
      sessionId,
      ipAddress: sessionData.ipAddress || "Unknown",
      userAgent: sessionData.userAgent || "Unknown",
      deviceInfo: sessionData.deviceInfo || "Unknown",
      lastActive: new Date().toISOString(),
      createdAt: sessionDoc.exists ? sessionDoc.data().createdAt : new Date().toISOString(),
      isActive: true,
    };
    await sessionRef.set(sessionInfo, {merge: true});
    return {id: sessionRef.id, ...sessionInfo};
  } catch (error) {
    logger.error("Failed to create/update session", error, {userId, sessionId});
    throw error;
  }
};

const getUserSessions = async (userId) => {
  try {
    const sessionsRef = db.collection("userSessions")
        .where("userId", "==", userId)
        .where("isActive", "==", true);
    const snapshot = await sessionsRef.get();
    const sessions = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    return sessions.sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));
  } catch (error) {
    logger.error("Failed to get user sessions", error, {userId});
    throw error;
  }
};

const revokeSession = async (userId, sessionId) => {
  try {
    const sessionRef = db.collection("userSessions").doc(`${userId}_${sessionId}`);
    await sessionRef.update({isActive: false, revokedAt: new Date().toISOString()});
    try {
      await auth.revokeRefreshTokens(userId);
    } catch (authError) {
      logger.warn("Failed to revoke refresh tokens", authError);
    }
    logger.info("Session revoked", {userId, sessionId});
  } catch (error) {
    logger.error("Failed to revoke session", error, {userId, sessionId});
    throw error;
  }
};

const revokeAllOtherSessions = async (userId, currentSessionId) => {
  try {
    const sessions = await getUserSessions(userId);
    const revokePromises = sessions
        .filter((session) => session.sessionId !== currentSessionId)
        .map((session) => revokeSession(userId, session.sessionId));
    await Promise.all(revokePromises);
    try {
      await auth.revokeRefreshTokens(userId);
    } catch (authError) {
      logger.warn("Failed to revoke all refresh tokens", authError);
    }
    logger.info("All other sessions revoked", {userId, currentSessionId});
  } catch (error) {
    logger.error("Failed to revoke all other sessions", error, {userId});
    throw error;
  }
};

module.exports = {
  createOrUpdateSession,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
};

