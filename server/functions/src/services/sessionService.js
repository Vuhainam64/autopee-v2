/**
 * Session Service
 * Business logic for user session management
 */

const {db} = require("../config");
const {auth} = require("../config");
const logger = require("../utils/logger");

/**
 * Create or update session record
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID (token ID)
 * @param {object} sessionData - Session data (IP, userAgent, etc.)
 * @returns {Promise<object>} Created/updated session
 */
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

    return {
      id: sessionRef.id,
      ...sessionInfo,
    };
  } catch (error) {
    logger.error("Failed to create/update session", error, {userId, sessionId});
    throw error;
  }
};

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of active sessions
 */
const getUserSessions = async (userId) => {
  try {
    // Query without orderBy first to avoid index requirement
    // We'll sort in memory instead
    const sessionsRef = db.collection("userSessions")
        .where("userId", "==", userId)
        .where("isActive", "==", true);

    const snapshot = await sessionsRef.get();

    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by lastActive descending
    return sessions.sort((a, b) => {
      const timeA = new Date(a.lastActive || 0).getTime();
      const timeB = new Date(b.lastActive || 0).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    logger.error("Failed to get user sessions", error, {userId});
    throw error;
  }
};

/**
 * Revoke a specific session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID to revoke
 * @returns {Promise<void>}
 */
const revokeSession = async (userId, sessionId) => {
  try {
    // Mark session as inactive in Firestore
    const sessionRef = db.collection("userSessions").doc(`${userId}_${sessionId}`);
    await sessionRef.update({
      isActive: false,
      revokedAt: new Date().toISOString(),
    });

    // Revoke the token in Firebase Auth
    try {
      await auth.revokeRefreshTokens(userId);
    } catch (authError) {
      logger.warn("Failed to revoke refresh tokens", authError);
      // Continue even if token revocation fails
    }

    logger.info("Session revoked", {userId, sessionId});
  } catch (error) {
    logger.error("Failed to revoke session", error, {userId, sessionId});
    throw error;
  }
};

/**
 * Revoke all sessions except current one
 * @param {string} userId - User ID
 * @param {string} currentSessionId - Current session ID to keep
 * @returns {Promise<void>}
 */
const revokeAllOtherSessions = async (userId, currentSessionId) => {
  try {
    const sessions = await getUserSessions(userId);

    // Revoke all sessions except current
    const revokePromises = sessions
        .filter((session) => session.sessionId !== currentSessionId)
        .map((session) => revokeSession(userId, session.sessionId));

    await Promise.all(revokePromises);

    // Revoke all refresh tokens (will force re-login on all devices)
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

