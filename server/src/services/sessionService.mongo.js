const UserSession = require("../models/UserSession");

const toPlainSession = (doc) => ({
  id: `${doc.userId}_${doc.sessionId}`,
  userId: doc.userId,
  sessionId: doc.sessionId,
  ipAddress: doc.ipAddress,
  userAgent: doc.userAgent,
  deviceInfo: doc.deviceInfo,
  lastActive: doc.lastActive?.toISOString?.() || null,
  createdAt: doc.createdAt?.toISOString?.() || null,
  revokedAt: doc.revokedAt?.toISOString?.() || null,
  isActive: doc.isActive,
});

const createOrUpdateSession = async (userId, sessionId, sessionData) => {
  const now = new Date();

  const update = {
    $set: {
      userId,
      sessionId,
      ipAddress: sessionData.ipAddress || "Unknown",
      userAgent: sessionData.userAgent || "Unknown",
      deviceInfo: sessionData.deviceInfo || "Unknown",
      lastActive: now,
      isActive: true,
    },
    $setOnInsert: {
      createdAt: now,
    },
  };

  const doc = await UserSession.findOneAndUpdate(
    { userId, sessionId },
    update,
    { new: true, upsert: true },
  ).lean();

  return toPlainSession(doc);
};

const getUserSessions = async (userId) => {
  const docs = await UserSession.find({ userId, isActive: true }).lean();
  return docs
    .map(toPlainSession)
    .sort(
      (a, b) =>
        new Date(b.lastActive || 0) - new Date(a.lastActive || 0),
    );
};

const revokeSession = async (userId, sessionId) => {
  const now = new Date();
  await UserSession.updateOne(
    { userId, sessionId },
    { $set: { isActive: false, revokedAt: now } },
  );
};

const revokeAllOtherSessions = async (userId, currentSessionId) => {
  const now = new Date();
  await UserSession.updateMany(
    { userId, sessionId: { $ne: currentSessionId } },
    { $set: { isActive: false, revokedAt: now } },
  );
};

module.exports = {
  createOrUpdateSession,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
};


