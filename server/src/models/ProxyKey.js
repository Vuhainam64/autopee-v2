const mongoose = require('mongoose')

/**
 * Lưu thông tin Proxy Key từ KiotProxy
 */
const proxyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: '',
    },
    region: {
      type: String,
      enum: ['bac', 'trung', 'nam', 'random'],
      default: 'random',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Thông tin proxy hiện tại
    currentProxy: {
      realIpAddress: String,
      http: String,
      socks5: String,
      httpPort: Number,
      socks5Port: Number,
      host: String,
      location: String,
      expirationAt: Number, // Unix timestamp
      ttl: Number, // Thời gian sống (giây)
      ttc: Number, // Thời gian còn lại (giây)
      nextRequestAt: Number, // Unix timestamp
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    // Các API endpoints sử dụng proxy này
    usedByApis: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    collection: 'proxykeys',
  },
)

// Index để query nhanh
proxyKeySchema.index({ isActive: 1, createdAt: -1 })
proxyKeySchema.index({ 'currentProxy.expirationAt': 1 })

const ProxyKey = mongoose.model('ProxyKey', proxyKeySchema)

module.exports = ProxyKey

