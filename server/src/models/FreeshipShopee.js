const mongoose = require('mongoose')

/**
 * Lưu thông tin freeship Shopee
 */
const freeshipShopeeSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    promotionId: {
      type: Number,
      required: true,
      index: true,
    },
    voucherCode: {
      type: String,
      required: true,
      index: true,
    },
    signature: {
      type: String,
      required: true,
    },
    voucherName: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    
    // Thông tin giảm giá
    discountValue: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountCap: {
      type: Number,
      default: 0,
    },
    minSpend: {
      type: Number,
      default: 0,
    },
    
    // Thông tin reward
    rewardValue: {
      type: Number,
      default: 0,
    },
    rewardPercentage: {
      type: Number,
      default: 0,
    },
    rewardType: {
      type: Number,
      default: 0,
    },
    
    // Thời gian
    startTime: {
      type: Number, // Unix timestamp
      default: 0,
    },
    endTime: {
      type: Number, // Unix timestamp
      default: 0,
    },
    claimStartTime: {
      type: Number, // Unix timestamp
      default: 0,
    },
    claimEndTime: {
      type: Number, // Unix timestamp
      default: 0,
    },
    
    // Trạng thái
    hasExpired: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    fullyRedeemed: {
      type: Boolean,
      default: false,
    },
    fullyClaimed: {
      type: Boolean,
      default: false,
    },
    fullyUsed: {
      type: Boolean,
      default: false,
    },
    
    // Điều kiện
    newUserOnly: {
      type: Boolean,
      default: false,
    },
    shopeeWalletOnly: {
      type: Boolean,
      default: false,
    },
    productLimit: {
      type: Boolean,
      default: false,
    },
    
    // Giới hạn sử dụng
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    leftCount: {
      type: Number,
      default: null,
    },
    
    // Loại voucher
    voucherMarketType: {
      type: Number,
      default: 2, // Freeship thường là type 2
    },
    useType: {
      type: Number,
      default: 0,
    },
    
    // Hiển thị
    iconText: {
      type: String,
      default: 'FREESHIP',
    },
    iconHash: {
      type: String,
      default: '',
    },
    customisedLabels: {
      type: [String],
      default: [],
    },
    brandingColor: {
      type: String,
      default: '#EE4D2D',
    },
    
    // Metadata từ Shopee
    customerReferenceId: {
      type: String,
      default: null,
    },
    shopId: {
      type: Number,
      default: 0,
    },
    shopName: {
      type: String,
      default: null,
    },
    
    // Raw data để backup
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    collection: 'freeshipshopee',
  },
)

// Index để query nhanh
freeshipShopeeSchema.index({ promotionId: 1, voucherCode: 1 }, { unique: true })
freeshipShopeeSchema.index({ hasExpired: 1, disabled: 1 })
freeshipShopeeSchema.index({ createdAt: -1 })

const FreeshipShopee = mongoose.model('FreeshipShopee', freeshipShopeeSchema)

module.exports = FreeshipShopee

