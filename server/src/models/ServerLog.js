const mongoose = require('mongoose')

const serverLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      enum: ['info', 'warn', 'error', 'debug', 'client_error'],
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      default: 'autopee-api',
      index: true,
    },
    traceId: {
      type: String,
      default: null,
      index: true,
    },
    errorCode: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    endpoint: {
      type: String,
      default: null,
      index: true,
    },
    method: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index để query nhanh
serverLogSchema.index({ timestamp: -1 })
serverLogSchema.index({ level: 1, timestamp: -1 })
serverLogSchema.index({ userId: 1, timestamp: -1 })
serverLogSchema.index({ endpoint: 1, timestamp: -1 })
serverLogSchema.index({ traceId: 1, timestamp: -1 })
serverLogSchema.index({ errorCode: 1, timestamp: -1 })

const ServerLog = mongoose.model('ServerLog', serverLogSchema)

module.exports = ServerLog

