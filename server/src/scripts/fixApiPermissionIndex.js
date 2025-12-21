/**
 * Script để sửa index của ApiPermission
 * Xóa unique index cũ trên endpoint và tạo composite unique index mới trên (endpoint, method)
 */

require('dotenv').config()
const mongoose = require('mongoose')
const ApiPermission = require('../models/ApiPermission')

async function fixIndex() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopee'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('apipermissions')

    // Xóa index cũ trên endpoint (nếu có)
    try {
      await collection.dropIndex('endpoint_1')
      console.log('✓ Đã xóa index cũ: endpoint_1')
    } catch (error) {
      if (error.code === 27) {
        console.log('⚠ Index endpoint_1 không tồn tại, bỏ qua')
      } else {
        console.error('Lỗi khi xóa index cũ:', error.message)
      }
    }

    // Tạo composite unique index mới
    try {
      await collection.createIndex(
        { endpoint: 1, method: 1 },
        { unique: true, name: 'endpoint_1_method_1' }
      )
      console.log('✓ Đã tạo composite unique index: endpoint_1_method_1')
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠ Index endpoint_1_method_1 đã tồn tại')
      } else {
        console.error('Lỗi khi tạo index mới:', error.message)
        throw error
      }
    }

    // Kiểm tra và xóa các duplicate records (nếu có)
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { endpoint: '$endpoint', method: '$method' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]).toArray()

    if (duplicates.length > 0) {
      console.log(`\n⚠ Tìm thấy ${duplicates.length} nhóm duplicate:`)
      for (const dup of duplicates) {
        console.log(`  - ${dup._id.endpoint} [${dup._id.method}]: ${dup.count} records`)
        // Giữ lại record đầu tiên, xóa các record còn lại
        const idsToDelete = dup.ids.slice(1)
        await collection.deleteMany({ _id: { $in: idsToDelete } })
        console.log(`    ✓ Đã xóa ${idsToDelete.length} duplicate records`)
      }
    } else {
      console.log('✓ Không có duplicate records')
    }

    console.log('\n✅ Hoàn thành! Index đã được cập nhật.')
    console.log('\nBây giờ bạn có thể tạo nhiều permission cho cùng endpoint với method khác nhau.')

  } catch (error) {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nĐã ngắt kết nối MongoDB')
  }
}

// Chạy script
fixIndex()

