const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['bug', 'feature', 'other'],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'in_progress', 'resolved', 'rejected'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
feedbackSchema.index({ status: 1, createdAt: -1 })
feedbackSchema.index({ type: 1, status: 1, createdAt: -1 })
feedbackSchema.index({ userId: 1, createdAt: -1 })

const Feedback = mongoose.model('Feedback', feedbackSchema)

module.exports = Feedback
