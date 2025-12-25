const mongoose = require('mongoose')

const viotpKeySchema = new mongoose.Schema(
  {
    userId: {
      // firebase uid
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    token: {
      type: String,
      required: true,
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

viotpKeySchema.index({ userId: 1, createdAt: -1 })
viotpKeySchema.index({ userId: 1, name: 1 })

const ViotpKey = mongoose.model('ViotpKey', viotpKeySchema)

module.exports = ViotpKey

