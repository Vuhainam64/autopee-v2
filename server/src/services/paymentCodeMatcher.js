const PaymentRequest = require('../models/PaymentRequest')
const User = require('../models/User')

/**
 * Tìm userId từ transaction data
 * SePay gửi webhook với các field:
 * - code: Mã thanh toán (nếu SePay tự động nhận diện được)
 * - content: Nội dung chuyển khoản (user nhập vào)
 * 
 * Payment code format: TIMESTAMP_BASE36_RANDOM (ví dụ: LKJ8H9F2ABC123XY, khoảng 14-16 ký tự)
 * 
 * Logic tìm kiếm:
 * 1. Ưu tiên tìm trong field `code` (nếu SePay đã nhận diện được)
 * 2. Tìm trong `content` bằng nhiều strategies
 */
async function findUserIdFromTransaction(transactionData) {
  let userId = null
  let paymentRequest = null

  // Strategy 1: Tìm trong field `code` (ưu tiên cao nhất)
  // SePay có thể tự động nhận diện payment code và đưa vào field `code`
  if (transactionData.code) {
    // Thử tìm user theo UID trước (nếu code là user ID)
    const user = await User.findOne({
      uid: transactionData.code,
    }).lean()

    if (user) {
      return { userId: user.uid, paymentRequest: null }
    }

    // Nếu không phải UID, thử tìm payment request
    paymentRequest = await PaymentRequest.findOne({
      paymentCode: transactionData.code.trim(),
      status: 'pending',
    }).lean()

    if (paymentRequest) {
      return { userId: paymentRequest.userId, paymentRequest }
    }
  }

  // Strategy 2: Tìm trong field `content`
  // Content có thể chứa payment code ở bất kỳ đâu
  // Ví dụ: "Qagaud6790 SEPAY5369 1 Vu Hai Nam chuyen tien FT25356227930001 Trace 289159"
  // Payment code có thể là: "2NUZKCA1734567890ABC123"
  if (transactionData.content) {
    const content = transactionData.content.trim()

    // 2.1: Tìm payment code đầy đủ (thường dài 12-16 ký tự)
    // Tách content thành các từ và tìm từ dài >= 12 ký tự
    const words = content.split(/\s+/)
    const longWords = words.filter((word) => word.length >= 12)

    for (const word of longWords) {
      paymentRequest = await PaymentRequest.findOne({
        paymentCode: word.trim(),
        status: 'pending',
      }).lean()

      if (paymentRequest) {
        return { userId: paymentRequest.userId, paymentRequest }
      }
    }

    // 2.2: Tìm payment code bằng cách so sánh với tất cả payment requests đang pending
    // Nếu có amount, filter theo amount để giảm số lượng cần check
    const query = { status: 'pending' }
    if (transactionData.transferAmount) {
      query.amount = transactionData.transferAmount
    }

    const pendingPayments = await PaymentRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(20) // Giới hạn 20 payment gần nhất
      .lean()

    // Kiểm tra xem content có chứa payment code nào không
    for (const payment of pendingPayments) {
      if (content.includes(payment.paymentCode)) {
        return { userId: payment.userId, paymentRequest: payment }
      }
    }

    // 2.3: Fuzzy match - tìm payment code có chứa một phần của content
    // Hoặc ngược lại, content chứa một phần của payment code
    // (Trường hợp user nhập không đầy đủ)
    for (const payment of pendingPayments) {
      const paymentCode = payment.paymentCode
      // Kiểm tra nếu content chứa ít nhất 8 ký tự đầu của payment code
      if (paymentCode.length >= 8) {
        const codePrefix = paymentCode.substring(0, 8)
        if (content.includes(codePrefix)) {
          return { userId: payment.userId, paymentRequest: payment }
        }
      }
    }
  }

  // Strategy 3: Tìm bằng amount và thời gian (fallback)
  // Nếu có amount và không tìm thấy bằng code/content
  // Tìm payment request có cùng amount và tạo trong vòng 5 phút gần đây
  if (transactionData.transferAmount && transactionData.transferType === 'in') {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    paymentRequest = await PaymentRequest.findOne({
      amount: transactionData.transferAmount,
      status: 'pending',
      createdAt: { $gte: fiveMinutesAgo },
    })
      .sort({ createdAt: -1 })
      .lean()

    if (paymentRequest) {
      // Log để admin có thể xử lý thủ công nếu cần
      console.warn(
        `[PaymentCodeMatcher] Found payment by amount match: ${paymentRequest.paymentCode}, but no code found in content`,
      )
      return { userId: paymentRequest.userId, paymentRequest }
    }
  }

  return { userId: null, paymentRequest: null }
}

module.exports = { findUserIdFromTransaction }

