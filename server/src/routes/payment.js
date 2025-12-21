const express = require('express')
const { handleAsync } = require('../middleware/error')
const { authenticate } = require('../middleware/auth')
const PaymentRequest = require('../models/PaymentRequest')
const Transaction = require('../models/Transaction')
const { getUserProfile } = require('../services/userService.mongo')
const { getUserTransactions, getUserTotalDeposit } = require('../services/transactionService')

const router = express.Router()

/**
 * POST /payment/deposit
 * Tạo payment request để nạp tiền
 * User sẽ nhận được payment code để chuyển tiền
 */
router.post(
  '/deposit',
  authenticate,
  handleAsync(async (req, res) => {
    const { amount, description } = req.body

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Số tiền phải lớn hơn 0' },
      })
    }

    const userId = req.user.uid

    // Tạo payment code duy nhất (có thể dùng UUID hoặc format khác)
    const paymentCode = generatePaymentCode(userId)

    // Thời gian hết hạn: 1 phút từ bây giờ
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 1)

    // Tạo payment request
    const paymentRequest = await PaymentRequest.create({
      userId,
      paymentCode,
      amount,
      status: 'pending',
      expiresAt,
      description: description || `Nạp tiền ${amount.toLocaleString('vi-VN')} VND`,
    })

    res.json({
      success: true,
      data: {
        paymentRequest: {
          id: paymentRequest._id,
          paymentCode: paymentRequest.paymentCode,
          amount: paymentRequest.amount,
          status: paymentRequest.status,
          expiresAt: paymentRequest.expiresAt,
          description: paymentRequest.description,
        },
        // Hướng dẫn nạp tiền
        instructions: {
          step1: 'Chuyển khoản số tiền chính xác: ' + amount.toLocaleString('vi-VN') + ' VND',
          step2: 'Nội dung chuyển khoản: ' + paymentCode,
          step3: 'Hệ thống sẽ tự động cập nhật số dư sau 1-2 phút',
          note: 'Payment code sẽ hết hạn sau 1 phút',
        },
      },
    })
  }),
)

/**
 * GET /payment/deposit/:paymentCode/status
 * Kiểm tra trạng thái payment request
 */
router.get(
  '/deposit/:paymentCode/status',
  authenticate,
  handleAsync(async (req, res) => {
    const { paymentCode } = req.params
    const userId = req.user.uid

    const paymentRequest = await PaymentRequest.findOne({
      paymentCode,
      userId, // Chỉ user tạo mới có thể xem
    }).lean()

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy payment request' },
      })
    }

    // Kiểm tra hết hạn
    const isExpired = new Date() > new Date(paymentRequest.expiresAt)
    if (isExpired && paymentRequest.status === 'pending') {
      await PaymentRequest.updateOne(
        { _id: paymentRequest._id },
        { $set: { status: 'expired' } },
      )
      paymentRequest.status = 'expired'
    }

    // Lấy thông tin transaction nếu đã completed
    let transaction = null
    if (paymentRequest.status === 'completed' && paymentRequest.transactionId) {
      transaction = await Transaction.findById(paymentRequest.transactionId).lean()
    }

    res.json({
      success: true,
      data: {
        paymentRequest: {
          id: paymentRequest._id,
          paymentCode: paymentRequest.paymentCode,
          amount: paymentRequest.amount,
          status: paymentRequest.status,
          expiresAt: paymentRequest.expiresAt,
          description: paymentRequest.description,
          createdAt: paymentRequest.createdAt,
        },
        transaction: transaction
          ? {
              id: transaction._id,
              sepayId: transaction.sepayId,
              gateway: transaction.gateway,
              transactionDate: transaction.transactionDate,
              transferAmount: transaction.transferAmount,
              status: transaction.status,
            }
          : null,
        isExpired,
      },
    })
  }),
)

/**
 * GET /payment/deposit/history
 * Lấy lịch sử nạp tiền của user
 */
router.get(
  '/deposit/history',
  authenticate,
  handleAsync(async (req, res) => {
    const userId = req.user.uid
    const { page = 1, limit = 20, status } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    const query = { userId }
    if (status) {
      query.status = status
    }

    const [paymentRequests, total] = await Promise.all([
      PaymentRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PaymentRequest.countDocuments(query),
    ])

    // Lấy thông tin transaction cho các payment đã completed
    const paymentRequestsWithTransaction = await Promise.all(
      paymentRequests.map(async (pr) => {
        let transaction = null
        if (pr.status === 'completed' && pr.transactionId) {
          transaction = await Transaction.findById(pr.transactionId)
            .select('sepayId gateway transactionDate transferAmount status')
            .lean()
        }
        return {
          ...pr,
          transaction,
        }
      }),
    )

    res.json({
      success: true,
      data: {
        paymentRequests: paymentRequestsWithTransaction,
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

/**
 * GET /payment/balance
 * Lấy thông tin số dư và tổng nạp tiền
 */
router.get(
  '/balance',
  authenticate,
  handleAsync(async (req, res) => {
    const userId = req.user.uid

    const userProfile = await getUserProfile(userId)
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy thông tin người dùng' },
      })
    }

    const totalDeposit = await getUserTotalDeposit(userId)

    // Đếm số payment request pending
    const pendingCount = await PaymentRequest.countDocuments({
      userId,
      status: 'pending',
    })

    res.json({
      success: true,
      data: {
        currentBalance: userProfile.walletBalance || 0,
        totalDeposit,
        pendingDeposits: pendingCount,
      },
    })
  }),
)

/**
 * POST /payment/deposit/:paymentCode/cancel
 * Hủy payment request (chỉ khi status là pending)
 */
router.post(
  '/deposit/:paymentCode/cancel',
  authenticate,
  handleAsync(async (req, res) => {
    const { paymentCode } = req.params
    const userId = req.user.uid

    const paymentRequest = await PaymentRequest.findOne({
      paymentCode,
      userId,
      status: 'pending',
    })

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy payment request hoặc đã được xử lý' },
      })
    }

    // Kiểm tra hết hạn
    const isExpired = new Date() > new Date(paymentRequest.expiresAt)
    if (isExpired) {
      await PaymentRequest.updateOne(
        { _id: paymentRequest._id },
        { $set: { status: 'expired' } },
      )
      return res.json({
        success: true,
        message: 'Payment request đã hết hạn',
        data: { status: 'expired' },
      })
    }

    // Hủy payment request
    await PaymentRequest.updateOne(
      { _id: paymentRequest._id },
      { $set: { status: 'cancelled' } },
    )

    res.json({
      success: true,
      message: 'Đã hủy payment request',
      data: {
        paymentCode: paymentRequest.paymentCode,
        status: 'cancelled',
      },
    })
  }),
)

/**
 * Generate unique payment code
 * Format: USERID_TIMESTAMP_RANDOM
 */
function generatePaymentCode(userId) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  // Lấy 8 ký tự đầu của userId để code ngắn gọn hơn
  const userIdShort = userId.substring(0, 8).toUpperCase()
  return `${userIdShort}${timestamp}${random}`
}

module.exports = router

