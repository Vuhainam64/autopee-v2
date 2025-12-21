const express = require('express')
const { handleAsync } = require('../middleware/error')
const Transaction = require('../models/Transaction')
const { logError } = require('../middleware/logger')
const { verifySePayWebhook } = require('../middleware/verifySePayWebhook')
const { authenticate } = require('../middleware/auth')
const { processTransaction } = require('../services/transactionService')

const router = express.Router()

/**
 * GET /webhooks/sepay/health
 * Health check endpoint để test webhook có hoạt động không
 * Không cần authentication
 */
router.get('/sepay/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  })
})

/**
 * POST /webhooks/sepay
 * Nhận webhook từ SePay khi có giao dịch
 * 
 * Authentication: 
 * - Set SEPAY_WEBHOOK_AUTH=true trong .env để enable authentication
 * - Set SEPAY_WEBHOOK_KEY=your_api_key trong .env để config API Key
 * - SePay sẽ gửi header: Authorization: Apikey YOUR_API_KEY
 * - Hoặc có thể dùng IP whitelist: SEPAY_IP_WHITELIST=ip1,ip2
 * 
 * Lưu ý: Nếu dùng Cloudflare, cần cấu hình để bypass challenge cho endpoint này
 */
const webhookAuth = process.env.SEPAY_WEBHOOK_AUTH === 'true' 
  ? verifySePayWebhook 
  : (req, res, next) => next() // Skip auth nếu không enable

router.post(
  '/sepay',
  webhookAuth,
  handleAsync(async (req, res) => {
    try {
      const data = req.body

      // Validate dữ liệu bắt buộc
      if (!data.id || !data.gateway || !data.transactionDate || !data.transferType || data.transferAmount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc',
        })
      }

      // Kiểm tra trùng lặp giao dịch (chống duplicate)
      const existingTransaction = await Transaction.findOne({ sepayId: data.id }).lean()
      if (existingTransaction) {
        // Nếu đã tồn tại, trả về success để SePay không retry
        return res.status(200).json({
          success: true,
          message: 'Giao dịch đã được xử lý trước đó',
        })
      }

      // Tính toán amountIn và amountOut
      const amountIn = data.transferType === 'in' ? data.transferAmount : 0
      const amountOut = data.transferType === 'out' ? data.transferAmount : 0

      // Parse transactionDate
      const transactionDate = new Date(data.transactionDate)

      // Tạo transaction mới
      const transaction = await Transaction.create({
        sepayId: data.id,
        gateway: data.gateway,
        transactionDate: transactionDate,
        accountNumber: data.accountNumber || null,
        subAccount: data.subAccount || null,
        transferType: data.transferType,
        transferAmount: data.transferAmount,
        amountIn,
        amountOut,
        accumulated: data.accumulated || 0,
        code: data.code || null,
        content: data.content || null,
        referenceCode: data.referenceCode || null,
        description: data.description || null,
        rawData: data,
        status: 'pending',
        // TODO: Map userId từ code nếu có logic mapping
        userId: null,
      })

      // Xử lý logic nghiệp vụ: map userId, update wallet balance, etc.
      await processTransaction(transaction)

      // Trả về success theo format SePay yêu cầu
      res.status(201).json({
        success: true,
        message: 'Webhook đã được xử lý thành công',
        transactionId: transaction._id,
      })
    } catch (error) {
      // Log error để debug
      await logError(error, req, {
        webhook: 'sepay',
        body: req.body,
      })

      // Trả về error để SePay có thể retry
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi xử lý webhook',
      })
    }
  }),
)


/**
 * GET /webhooks/sepay/transactions
 * Lấy danh sách transactions (cho admin xem)
 * Cần authentication
 */
router.get(
  '/sepay/transactions',
  authenticate,
  handleAsync(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      status,
      transferType,
      code,
      startDate,
      endDate,
    } = req.query

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Build query
    const query = {}

    if (status) {
      query.status = status
    }

    if (transferType) {
      query.transferType = transferType
    }

    if (code) {
      query.code = code
    }

    if (startDate || endDate) {
      query.transactionDate = {}
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate)
      }
    }

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ])

    res.json({
      success: true,
      data: {
        transactions,
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

module.exports = router

