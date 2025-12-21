const mongoose = require('mongoose')

const paymentRequestSchema = new mongoose.Schema(
  {
    // User ID
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Payment code để user chuyển tiền (unique)
    paymentCode: {
      type: String,
      required: true,
      unique: true,
    },
    // Số tiền cần nạp
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Trạng thái: pending, completed, expired, cancelled
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Thời gian hết hạn (mặc định 30 phút)
    expiresAt: {
      type: Date,
      required: true,
    },
    // Transaction ID từ SePay (nếu đã thanh toán)
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    // Mô tả/ghi chú
    description: {
      type: String,
      default: null,
    },
    // Metadata bổ sung
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Index để query nhanh
// Note: paymentCode đã có unique index tự động từ unique: true, không cần thêm
paymentRequestSchema.index({ userId: 1, status: 1 })
paymentRequestSchema.index({ paymentCode: 1, status: 1 }) // Composite index với status
paymentRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // Tự động xóa khi hết hạn

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema)

module.exports = PaymentRequest

