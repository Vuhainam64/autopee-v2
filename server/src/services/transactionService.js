const Transaction = require('../models/Transaction')
const User = require('../models/User')
const PaymentRequest = require('../models/PaymentRequest')
const { findUserIdFromTransaction } = require('./paymentCodeMatcher')

/**
 * Xử lý logic nghiệp vụ cho transaction từ SePay
 * 
 * SePay gửi webhook với các field:
 * - code: Mã thanh toán (nếu SePay tự động nhận diện được từ nội dung)
 * - content: Nội dung chuyển khoản (user nhập vào khi chuyển tiền)
 * 
 * Logic nhận diện:
 * 1. Tìm trong field `code` trước (nếu SePay đã nhận diện được)
 * 2. Tìm trong field `content` bằng nhiều strategies
 * 3. Fallback: Tìm bằng amount và thời gian
 */
async function processTransaction(transactionDoc) {
  try {
    // Tìm userId và paymentRequest từ transaction data
    const { userId, paymentRequest } = await findUserIdFromTransaction({
      code: transactionDoc.code,
      content: transactionDoc.content,
      transferAmount: transactionDoc.transferAmount,
      transferType: transactionDoc.transferType,
    })

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
        console.warn(
          `[TransactionService] Transaction ${transactionDoc.sepayId} không tìm thấy userId. Content: ${transactionDoc.content}, Code: ${transactionDoc.code}`,
        )
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

