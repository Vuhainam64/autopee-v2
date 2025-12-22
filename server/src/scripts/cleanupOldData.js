/**
 * Script tự động xóa dữ liệu cũ sau 7 ngày
 * Chạy định kỳ (có thể dùng cron job hoặc node-cron)
 * 
 * Xóa:
 * - UsageHistory cũ hơn 7 ngày
 * - PaymentRequest đã completed/expired/cancelled cũ hơn 7 ngày
 * - Transaction cũ hơn 7 ngày (chỉ các transaction đã processed)
 */

require('dotenv').config()
const mongoose = require('mongoose')
const UsageHistory = require('../models/UsageHistory')
const PaymentRequest = require('../models/PaymentRequest')
const Transaction = require('../models/Transaction')
const ShopeeCookie = require('../models/ShopeeCookie')

async function cleanupOldData() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopee'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    console.log(`\n🧹 Bắt đầu dọn dẹp dữ liệu cũ hơn ${sevenDaysAgo.toISOString()}`)

    // 1. Xóa UsageHistory cũ hơn 7 ngày
    const usageHistoryResult = await UsageHistory.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`✓ Đã xóa ${usageHistoryResult.deletedCount} UsageHistory records`)

    // 2. Xóa PaymentRequest đã hoàn thành/cancel/expired cũ hơn 7 ngày
    const paymentRequestResult = await PaymentRequest.deleteMany({
      status: { $in: ['completed', 'expired', 'cancelled'] },
      updatedAt: { $lt: sevenDaysAgo },
    })
    console.log(`✓ Đã xóa ${paymentRequestResult.deletedCount} PaymentRequest records`)

    // 3. Xóa Transaction đã processed cũ hơn 7 ngày
    const transactionResult = await Transaction.deleteMany({
      status: 'processed',
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`✓ Đã xóa ${transactionResult.deletedCount} Transaction records`)

    // 4. Xóa ShopeeCookie cũ hơn 7 ngày
    const shopeeCookieResult = await ShopeeCookie.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    })
    console.log(`✓ Đã xóa ${shopeeCookieResult.deletedCount} ShopeeCookie records`)

    console.log('\n✅ Hoàn thành dọn dẹp!')
    console.log(`Tổng cộng đã xóa:`)
    console.log(`  - UsageHistory: ${usageHistoryResult.deletedCount}`)
    console.log(`  - PaymentRequest: ${paymentRequestResult.deletedCount}`)
    console.log(`  - Transaction: ${transactionResult.deletedCount}`)
    console.log(`  - ShopeeCookie: ${shopeeCookieResult.deletedCount}`)

  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nĐã ngắt kết nối MongoDB')
  }
}

// Chạy script
cleanupOldData()

