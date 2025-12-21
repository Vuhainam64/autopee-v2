const mongoose = require("mongoose");

const LogConfigSchema = new mongoose.Schema(
  {
    pattern: {
      type: String,
      required: true,
      // Pattern có thể là exact path hoặc regex pattern
      // Ví dụ: "/payment/deposit/:paymentCode/status" hoặc "^/payment/deposit/.*/status$"
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "ALL"],
      default: "ALL",
      // ALL nghĩa là áp dụng cho tất cả methods
    },
    enabled: {
      type: Boolean,
      default: true,
      // true = bỏ qua log, false = vẫn log
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

// Index để tìm nhanh
LogConfigSchema.index({ pattern: 1, method: 1 });

module.exports = mongoose.model("LogConfig", LogConfigSchema);

