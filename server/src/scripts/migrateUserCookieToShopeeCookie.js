/**
 * Script migration: Chuyển dữ liệu từ collection usercookies sang shopeecookies
 * và xóa collection usercookies cũ
 */

require('dotenv').config()
const mongoose = require('mongoose')

async function migrateUserCookieToShopeeCookie() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopee'
    await mongoose.connect(mongoUri)
    console.log('✓ Đã kết nối MongoDB')

    const db = mongoose.connection.db

    // Kiểm tra xem collection usercookies có tồn tại không
    const collections = await db.listCollections().toArray()
    const userCookieCollectionExists = collections.some(
      (col) => col.name === 'usercookies'
    )
    const shopeeCookieCollectionExists = collections.some(
      (col) => col.name === 'shopeecookies'
    )

    if (!userCookieCollectionExists) {
      console.log('⚠ Collection usercookies không tồn tại, không có gì để migrate')
      await mongoose.disconnect()
      return
    }

    console.log('\n🔄 Bắt đầu migration...')

    // Đếm số documents trong usercookies
    const userCookieCount = await db.collection('usercookies').countDocuments()
    console.log(`📊 Tìm thấy ${userCookieCount} documents trong usercookies`)

    if (userCookieCount === 0) {
      console.log('⚠ Không có dữ liệu để migrate')
      // Xóa collection rỗng
      await db.collection('usercookies').drop()
      console.log('✓ Đã xóa collection usercookies rỗng')
      await mongoose.disconnect()
      return
    }

    // Lấy tất cả documents từ usercookies
    const userCookies = await db.collection('usercookies').find({}).toArray()
    console.log(`📦 Đã lấy ${userCookies.length} documents`)

    // Nếu collection shopeecookies đã tồn tại, kiểm tra xem có dữ liệu chưa
    if (shopeeCookieCollectionExists) {
      const shopeeCookieCount = await db.collection('shopeecookies').countDocuments()
      if (shopeeCookieCount > 0) {
        console.log(`⚠ Collection shopeecookies đã có ${shopeeCookieCount} documents`)
        console.log('⚠ Bạn có muốn tiếp tục? Script sẽ insert thêm dữ liệu vào shopeecookies')
        // Có thể thêm logic để skip nếu đã có dữ liệu, nhưng ở đây ta sẽ insert thêm
      }
    }

    // Insert vào shopeecookies
    if (userCookies.length > 0) {
      // Sử dụng insertMany với ordered: false để không dừng khi có lỗi duplicate
      try {
        const result = await db.collection('shopeecookies').insertMany(userCookies, {
          ordered: false, // Không dừng khi có lỗi duplicate
        })
        console.log(`✓ Đã insert ${result.insertedCount} documents vào shopeecookies`)
        
        if (result.insertedCount < userCookies.length) {
          const skipped = userCookies.length - result.insertedCount
          console.log(`⚠ Đã bỏ qua ${skipped} documents (có thể do duplicate)`)
        }
      } catch (error) {
        // Nếu có lỗi duplicate, vẫn tiếp tục
        if (error.writeErrors) {
          const insertedCount = error.insertedCount || 0
          const errorCount = error.writeErrors.length
          console.log(`✓ Đã insert ${insertedCount} documents vào shopeecookies`)
          console.log(`⚠ Có ${errorCount} documents bị lỗi (có thể do duplicate)`)
        } else {
          throw error
        }
      }
    }

    // Xóa collection usercookies sau khi đã migrate xong
    console.log('\n🗑️  Đang xóa collection usercookies...')
    await db.collection('usercookies').drop()
    console.log('✓ Đã xóa collection usercookies')

    console.log('\n✅ Migration hoàn tất!')
    console.log(`📊 Tổng kết:`)
    console.log(`   - Đã migrate: ${userCookies.length} documents`)
    console.log(`   - Collection mới: shopeecookies`)
    console.log(`   - Collection cũ: usercookies (đã xóa)`)

  } catch (error) {
    console.error('❌ Lỗi khi migration:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n✓ Đã ngắt kết nối MongoDB')
  }
}

// Chạy script
migrateUserCookieToShopeeCookie()

