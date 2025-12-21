/**
 * Service tự động dọn dẹp dữ liệu cũ sau 7 ngày
 * Chạy mỗi ngày lúc 2:00 AM
 */

const cron = require('node-cron')
const UsageHistory = require('../models/UsageHistory')
const PaymentRequest = require('../models/PaymentRequest')
const Transaction = require('../models/Transaction')
const UserCookie = require('../models/UserCookie')

/**
 * Hàm dọn dẹp dữ liệu cũ
 */
async function cleanupOldData() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    console.log(`[CleanupService] Bắt đầu dọn dẹp dữ liệu cũ hơn ${sevenDaysAgo.toISOString()}`)

    // 1. Xóa UsageHistory cũ hơn 7 ngày
    const usageHistoryResult = await UsageHistory.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`[CleanupService] Đã xóa ${usageHistoryResult.deletedCount} UsageHistory records`)

    // 2. Xóa PaymentRequest đã hoàn thành/cancel/expired cũ hơn 7 ngày
    const paymentRequestResult = await PaymentRequest.deleteMany({
      status: { $in: ['completed', 'expired', 'cancelled'] },
      updatedAt: { $lt: sevenDaysAgo },
    })
    console.log(`[CleanupService] Đã xóa ${paymentRequestResult.deletedCount} PaymentRequest records`)

    // 3. Xóa Transaction đã processed cũ hơn 7 ngày
    const transactionResult = await Transaction.deleteMany({
      status: 'processed',
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`[CleanupService] Đã xóa ${transactionResult.deletedCount} Transaction records`)

    // 4. Xóa UserCookie cũ hơn 7 ngày
    const userCookieResult = await UserCookie.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`[CleanupService] Đã xóa ${userCookieResult.deletedCount} UserCookie records`)

    const totalDeleted =
      usageHistoryResult.deletedCount +
      paymentRequestResult.deletedCount +
      transactionResult.deletedCount +
      userCookieResult.deletedCount

    console.log(`[CleanupService] Hoàn thành! Tổng cộng đã xóa ${totalDeleted} records`)
  } catch (error) {
    console.error('[CleanupService] Lỗi khi dọn dẹp:', error)
  }
}

/**
 * Khởi động scheduled task
 * Chạy mỗi ngày lúc 2:00 AM
 */
function startCleanupScheduler() {
  // Cron expression: "0 2 * * *" = Mỗi ngày lúc 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[CleanupService] Scheduled cleanup task started')
    await cleanupOldData()
  })

  console.log('[CleanupService] Cleanup scheduler started (runs daily at 2:00 AM)')
}

module.exports = {
  cleanupOldData,
  startCleanupScheduler,
}

