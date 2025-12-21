const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
  {
    // ID giao dịch từ SePay (unique)
    sepayId: {
      type: Number,
      required: true,
      unique: true,
    },
    gateway: {
      type: String,
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    accountNumber: {
      type: String,
      default: null,
    },
    subAccount: {
      type: String,
      default: null,
    },
    transferType: {
      type: String,
      enum: ['in', 'out'],
      required: true,
      index: true,
    },
    transferAmount: {
      type: Number,
      required: true,
    },
    amountIn: {
      type: Number,
      default: 0,
    },
    amountOut: {
      type: Number,
      default: 0,
    },
    accumulated: {
      type: Number,
      required: true,
    },
    code: {
      type: String,
      default: null,
      index: true,
    },
    content: {
      type: String,
      default: null,
    },
    referenceCode: {
      type: String,
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: null,
    },
    // Raw data từ SePay để backup
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Trạng thái xử lý
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
      index: true,
    },
    // User ID nếu có thể map được từ code
    userId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index để query nhanh
// Note: sepayId đã có unique index tự động từ unique: true, không cần thêm
transactionSchema.index({ referenceCode: 1, transferType: 1, transferAmount: 1 })
transactionSchema.index({ code: 1, status: 1 })
transactionSchema.index({ createdAt: -1 })

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction

