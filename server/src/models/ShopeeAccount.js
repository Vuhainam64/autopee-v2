const mongoose = require('mongoose')

const shopeeAccountSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccountCollection',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Thông tin từ API getAccountInfo
    userid: {
      type: Number,
      index: true,
    },
    username: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    nickname: {
      type: String,
      default: '',
    },
    shopid: {
      type: Number,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Cookie information
    spcF: {
      type: String,
      default: '',
    },
    cookieFull: {
      type: String,
      required: true,
    },
    spcSt: {
      type: String,
      default: '',
    },
    // Password để có thể export lại định dạng username|password|spc_f|spc_st
    password: {
      type: String,
      default: '',
    },
    // Raw data from API
    accountInfo: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastCheckedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Index để tìm nhanh accounts trong collection
shopeeAccountSchema.index({ collectionId: 1, createdAt: -1 })
shopeeAccountSchema.index({ userId: 1, collectionId: 1 })

const ShopeeAccount = mongoose.model('ShopeeAccount', shopeeAccountSchema)

module.exports = ShopeeAccount

