const mongoose = require('mongoose')

/**
 * Lịch sử sử dụng tiền của user
 * Lưu lại các giao dịch chi tiêu (dịch vụ đã sử dụng)
 */
const usageHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Loại dịch vụ (ví dụ: "Thuê số", "Check MVD", etc.)
    service: {
      type: String,
      required: true,
    },
    // Số tiền đã sử dụng (luôn là số âm)
    amount: {
      type: Number,
      required: true,
    },
    // Số dư sau khi thay đổi
    balanceAfter: {
      type: Number,
      required: true,
    },
    // Mã giao dịch (có thể là transaction ID hoặc reference code)
    transactionId: {
      type: String,
      default: null,
      index: true,
    },
    // Thông tin thêm về dịch vụ
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
)

// Index để query nhanh theo userId và thời gian
usageHistorySchema.index({ userId: 1, createdAt: -1 })
usageHistorySchema.index({ createdAt: 1 }) // Để tự động xóa sau 7 ngày

const UsageHistory = mongoose.model('UsageHistory', usageHistorySchema)

module.exports = UsageHistory

