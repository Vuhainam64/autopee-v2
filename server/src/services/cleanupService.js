/**
 * Service tự động dọn dẹp dữ liệu cũ sau 7 ngày
 * Chạy mỗi ngày lúc 2:00 AM
 */

const cron = require('node-cron')
const UsageHistory = require('../models/UsageHistory')
const PaymentRequest = require('../models/PaymentRequest')
const Transaction = require('../models/Transaction')
const ShopeeCookie = require('../models/ShopeeCookie')
const ServerLog = require('../models/ServerLog')
const proxyService = require('./proxyService')

/**
 * Hàm dọn dẹp dữ liệu cũ
 */
async function cleanupOldData() {
  try {
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const logsCutoff = new Date()
    logsCutoff.setDate(logsCutoff.getDate() - retentionDays)
    logsCutoff.setHours(0, 0, 0, 0)

    console.log(`[CleanupService] Bắt đầu dọn dẹp dữ liệu cũ hơn ${sevenDaysAgo.toISOString()} (logs retention: ${retentionDays} ngày, cutoff: ${logsCutoff.toISOString()})`)

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

    // 4. Xóa ShopeeCookie cũ hơn 7 ngày
    const shopeeCookieResult = await ShopeeCookie.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`[CleanupService] Đã xóa ${shopeeCookieResult.deletedCount} ShopeeCookie records`)

    // 5. Xóa ServerLog cũ hơn retentionDays (mặc định 30 ngày)
    const serverLogResult = await ServerLog.deleteMany({
      createdAt: { $lt: logsCutoff },
    })
    console.log(`[CleanupService] Đã xóa ${serverLogResult.deletedCount} ServerLog records (cũ hơn ${retentionDays} ngày)`)

    const totalDeleted =
      usageHistoryResult.deletedCount +
      paymentRequestResult.deletedCount +
      transactionResult.deletedCount +
      shopeeCookieResult.deletedCount +
      serverLogResult.deletedCount

    console.log(`[CleanupService] Hoàn thành! Tổng cộng đã xóa ${totalDeleted} records`)
  } catch (error) {
    console.error('[CleanupService] Lỗi khi dọn dẹp:', error)
  }
}

/**
 * Tự động đổi proxy cho các keys đã đến thời gian cho phép đổi
 */
async function autoRefreshProxies() {
  try {
    const result = await proxyService.autoRefreshExpiredProxies()
    if (result.total > 0) {
      console.log(`[ProxyService] Đã tự động đổi ${result.success}/${result.total} proxy keys`)
      if (result.failed > 0) {
        console.warn(`[ProxyService] ${result.failed} proxy keys không thể đổi:`, result.errors)
      }
    }
  } catch (error) {
    console.error('[ProxyService] Lỗi khi tự động đổi proxy:', error)
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

  // Tự động đổi proxy mỗi phút
  cron.schedule('* * * * *', async () => {
    await autoRefreshProxies()
  })

  console.log('[CleanupService] Cleanup scheduler started (runs daily at 2:00 AM)')
  console.log('[ProxyService] Auto refresh proxy scheduler started (runs every minute)')
}

module.exports = {
  cleanupOldData,
  startCleanupScheduler,
}

