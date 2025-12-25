const express = require('express')
const { authenticate } = require('../middleware/auth')
const { handleAsync } = require('../middleware/error')
const Feedback = require('../models/Feedback')
const { getUserProfile } = require('../services/userService.mongo')

const router = express.Router()

router.use(authenticate)

// NOTE: Admin permission middleware is applied automatically if this router is mounted inside /admin

// GET /admin/feedback - list feedbacks
router.get(
  '/',
  handleAsync(async (req, res) => {
    const { page = 1, limit = 50, type, status, search } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    const query = {}
    if (type) query.type = type
    if (status) query.status = status
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
      ]
    }

    const [items, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Feedback.countDocuments(query),
    ])

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    })
  }),
)

// PUT /admin/feedback/:id/status - update status
router.put(
  '/:id/status',
  handleAsync(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'status là bắt buộc' },
      })
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    ).lean()

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: 'Feedback không tồn tại' },
      })
    }

    res.json({ success: true, data: updated })
  }),
)

module.exports = router
