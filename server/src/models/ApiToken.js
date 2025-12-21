const mongoose = require("mongoose");

const ApiTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: "Default Token",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    // Thống kê sử dụng theo tháng
    monthlyUsage: [
      {
        month: String, // Format: "YYYY-MM"
        count: Number,
        successCount: Number,
        failedCount: Number,
      },
    ],
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

// Index để tìm nhanh token
ApiTokenSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("ApiToken", ApiTokenSchema);

