const Transaction = require('../models/Transaction')
const User = require('../models/User')
const PaymentRequest = require('../models/PaymentRequest')

/**
 * Xử lý logic nghiệp vụ cho transaction từ SePay
 */
async function processTransaction(transactionDoc) {
  try {
    let userId = null
    let paymentRequest = null

    // 1. Tìm userId từ code thanh toán (nếu có)
    // Code có thể là user ID hoặc payment code
    if (transactionDoc.code) {
      // Thử tìm user theo code (có thể là UID)
      const user = await User.findOne({
        uid: transactionDoc.code,
      }).lean()

      if (user) {
        userId = user.uid
      } else {
        // Nếu không tìm thấy user theo UID, thử tìm theo payment code
        paymentRequest = await PaymentRequest.findOne({
          paymentCode: transactionDoc.code,
          status: 'pending',
        }).lean()

        if (paymentRequest) {
          userId = paymentRequest.userId
        }
      }
    }

    // 2. Nếu không có code, thử tìm trong content (ví dụ: "Qagaud6790 SEPAY5369")
    // Parse content để tìm payment code hoặc user identifier
    if (!userId && transactionDoc.content) {
      // Ví dụ: content có thể chứa "Qagaud6790" hoặc payment code
      const contentParts = transactionDoc.content.split(' ')
      for (const part of contentParts) {
        // Thử tìm payment request theo code trong content
        paymentRequest = await PaymentRequest.findOne({
          paymentCode: part.trim(),
          status: 'pending',
        }).lean()

        if (paymentRequest) {
          userId = paymentRequest.userId
          break
        }
      }
    }

    // 3. Nếu là tiền vào (transferType === 'in'), cập nhật wallet balance
    if (transactionDoc.transferType === 'in' && transactionDoc.amountIn > 0) {
      if (userId) {
        // Cập nhật wallet balance cho user cụ thể
        await User.updateOne(
          { uid: userId },
          {
            $inc: { walletBalance: transactionDoc.amountIn },
            $set: { updatedAt: new Date() },
          },
        )

        // 4. Nếu có payment request, cập nhật status thành completed
        // Nếu chưa có paymentRequest, thử tìm lại một lần nữa
        if (!paymentRequest && transactionDoc.code) {
          paymentRequest = await PaymentRequest.findOne({
            paymentCode: transactionDoc.code,
            status: 'pending',
          }).lean()
        }

        if (paymentRequest) {
          await PaymentRequest.updateOne(
            { _id: paymentRequest._id },
            {
              $set: {
                status: 'completed',
                transactionId: transactionDoc._id,
              },
            },
          )
        }
      } else {
        // Nếu không có userId, chỉ lưu transaction mà không update balance
        // Có thể log để admin xử lý thủ công sau
      }
    }

    // 5. Update transaction với userId và status
    await Transaction.updateOne(
      { _id: transactionDoc._id },
      {
        $set: {
          userId: userId,
          status: 'processed',
        },
      },
    )

    return {
      success: true,
      userId,
      processed: true,
    }
  } catch (error) {
    // Nếu xử lý lỗi, update status thành failed
    await Transaction.updateOne(
      { _id: transactionDoc._id },
      { $set: { status: 'failed' } },
    )
    throw error
  }
}

/**
 * Lấy transaction theo sepayId
 */
async function getTransactionBySepayId(sepayId) {
  return await Transaction.findOne({ sepayId }).lean()
}

/**
 * Lấy transactions của một user
 */
async function getUserTransactions(userId, options = {}) {
  const { page = 1, limit = 50, transferType, status } = options
  const pageNum = parseInt(page, 10)
  const limitNum = parseInt(limit, 10)
  const skip = (pageNum - 1) * limitNum

  const query = { userId }

  if (transferType) {
    query.transferType = transferType
  }

  if (status) {
    query.status = status
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Transaction.countDocuments(query),
  ])

  return {
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  }
}

/**
 * Lấy tổng số tiền đã nạp của user
 */
async function getUserTotalDeposit(userId) {
  const result = await Transaction.aggregate([
    {
      $match: {
        userId,
        transferType: 'in',
        status: 'processed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amountIn' },
      },
    },
  ])

  return result.length > 0 ? result[0].total : 0
}

module.exports = {
  processTransaction,
  getTransactionBySepayId,
  getUserTransactions,
  getUserTotalDeposit,
}

