const mongoose = require("mongoose");

const PermissionHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["route", "api"],
      required: true,
      index: true,
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },
    changedBy: {
      type: String, // User UID
      required: true,
      index: true,
    },
    changedByName: {
      type: String, // User display name or email
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed, // Store old permission data
    },
    newData: {
      type: mongoose.Schema.Types.Mixed, // Store new permission data
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: false, // History should not be updated
    },
  },
);

// Index for efficient queries
PermissionHistorySchema.index({ type: 1, permissionId: 1, createdAt: -1 });
PermissionHistorySchema.index({ changedBy: 1, createdAt: -1 });

module.exports = mongoose.model("PermissionHistory", PermissionHistorySchema);

