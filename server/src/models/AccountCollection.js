const mongoose = require('mongoose')

const accountCollectionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    accountCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Index để tìm nhanh collections của user
accountCollectionSchema.index({ userId: 1, createdAt: -1 })

const AccountCollection = mongoose.model('AccountCollection', accountCollectionSchema)

module.exports = AccountCollection

