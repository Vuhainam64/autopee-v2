const mongoose = require('mongoose')

/**
 * Lưu cookie của user cho Shopee
 * Tự động xóa sau 7 ngày
 */
const userCookieSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Cookie string từ Shopee
    cookie: {
      type: String,
      required: true,
    },
    // Tên/ghi chú cho cookie (optional)
    name: {
      type: String,
      default: 'Default Cookie',
    },
    // Trạng thái (active/inactive)
    isActive: {
      type: Boolean,
      default: true,
    },
    // Lần cuối sử dụng
    lastUsedAt: {
      type: Date,
    },
    // Số lần sử dụng
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
)

// Index để query nhanh
userCookieSchema.index({ userId: 1, isActive: 1 })
userCookieSchema.index({ userId: 1, isActive: 1, usageCount: 1 }) // Để query cookie ít sử dụng nhất
userCookieSchema.index({ createdAt: 1 }) // Để tự động xóa sau 7 ngày

const UserCookie = mongoose.model('UserCookie', userCookieSchema)

module.exports = UserCookie

