const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    description: {
      type: String,
    },
    color: {
      type: String,
      default: "default",
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

// Index for sorting by score
RoleSchema.index({ score: 1 });

module.exports = mongoose.model("Role", RoleSchema);

