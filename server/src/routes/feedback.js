const express = require('express')
const { authenticate } = require('../middleware/auth')
const { handleAsync } = require('../middleware/error')
const Feedback = require('../models/Feedback')
const { getUserProfile } = require('../services/userService.mongo')

const router = express.Router()

// User submit feedback
// POST /feedback
router.post(
  '/',
  authenticate,
  handleAsync(async (req, res) => {
    const { type, title, description } = req.body

    if (!type || !title || !description) {
      return res.status(400).json({
        success: false,
        error: { message: 'type, title, description là bắt buộc' },
      })
    }

    const userProfile = await getUserProfile(req.user.uid)

    const feedback = await Feedback.create({
      type,
      title,
      description,
      userId: userProfile?._id,
      userEmail: userProfile?.email || req.user.email,
      metadata: {
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      },
    })

    res.json({ success: true, data: feedback })
  }),
)

module.exports = router
