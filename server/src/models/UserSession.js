const mongoose = require("mongoose");

const UserSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    ipAddress: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "Unknown" },
    deviceInfo: { type: String, default: "Unknown" },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: false,
  },
);

UserSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("UserSession", UserSessionSchema);


