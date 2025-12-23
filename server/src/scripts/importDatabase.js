/**
 * Script để import dữ liệu từ file JSON vào MongoDB
 * 
 * Cách sử dụng:
 * 1. Export biến môi trường (tùy chọn):
 *    - MONGODB_URI: MongoDB URI đích (mặc định: mongodb://localhost:27017/autopee)
 *    - IMPORT_DIR: Thư mục chứa file JSON (mặc định: ./backup)
 * 
 * 2. Chạy script:
 *    node src/scripts/importDatabase.js
 * 
 * Hoặc với npm:
 *    npm run import:database
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

async function importCollection(db, collectionName, importDir) {
  try {
    const filePath = path.join(importDir, `${collectionName}.json`)
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      console.log(`   ⏭️  File không tồn tại: ${filePath}`)
      return { collection: collectionName, count: 0, skipped: true }
    }
    
    console.log(`📦 Đang import collection: ${collectionName}`)
    
    // Đọc file JSON
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const documents = JSON.parse(fileContent)
    
    if (!Array.isArray(documents) || documents.length === 0) {
      console.log(`   ⏭️  File rỗng, bỏ qua`)
      return { collection: collectionName, count: 0, skipped: true }
    }
    
    console.log(`   Tìm thấy: ${documents.length} documents trong file`)
    
    // Xóa collection cũ (nếu có)
    const collection = db.collection(collectionName)
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      console.log(`   ⚠️  Collection đã có ${existingCount} documents, sẽ xóa và thay thế`)
      await collection.deleteMany({})
    }
    
    // Import documents
    if (documents.length > 0) {
      // Chuyển đổi string _id về ObjectId nếu cần
      const processedDocs = documents.map(doc => {
        if (doc._id && typeof doc._id === 'string') {
          doc._id = new mongoose.Types.ObjectId(doc._id)
        }
        // Xử lý các ObjectId khác trong nested objects
        return processObjectIds(doc)
      })
      
      await collection.insertMany(processedDocs)
    }
    
    // Verify
    const newCount = await collection.countDocuments()
    console.log(`   ✅ Đã import: ${newCount} documents`)
    
    if (newCount !== documents.length) {
      throw new Error(`Số lượng documents không khớp! File: ${documents.length}, Database: ${newCount}`)
    }
    
    return { collection: collectionName, count: newCount, skipped: false }
  } catch (error) {
    console.error(`   ❌ Lỗi khi import ${collectionName}:`, error.message)
    throw error
  }
}

// Helper function để xử lý ObjectId trong nested objects
function processObjectIds(obj) {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => processObjectIds(item))
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const processed = {}
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_id' && typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        processed[key] = new mongoose.Types.ObjectId(value)
      } else if (key.endsWith('Id') && typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        // Các field kết thúc bằng 'Id' có thể là ObjectId
        processed[key] = new mongoose.Types.ObjectId(value)
      } else {
        processed[key] = processObjectIds(value)
      }
    }
    return processed
  }
  
  return obj
}

async function importDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopee'
  const importDir = process.env.IMPORT_DIR || path.join(process.cwd(), 'backup')
  
  console.log('🚀 Bắt đầu import database...')
  console.log(`📤 MongoDB URI: ${mongoUri}`)
  console.log(`📥 Import directory: ${importDir}`)
  
  // Kiểm tra thư mục import
  if (!fs.existsSync(importDir)) {
    console.error(`❌ Lỗi: Thư mục không tồn tại: ${importDir}`)
    process.exit(1)
  }
  
  // Đọc metadata nếu có
  const metadataPath = path.join(importDir, 'metadata.json')
  let metadata = null
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    console.log(`📄 Đã tìm thấy metadata từ: ${metadata.exportedAt}`)
  }
  
  try {
    // Kết nối đến database
    console.log('\n📡 Đang kết nối đến MongoDB...')
    await mongoose.connect(mongoUri)
    const db = mongoose.connection.db
    
    console.log('✅ Đã kết nối thành công!\n')
    
    // Lấy danh sách file JSON trong thư mục
    const files = fs.readdirSync(importDir)
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'metadata.json')
    
    console.log(`📋 Tìm thấy ${jsonFiles.length} file JSON:`)
    jsonFiles.forEach(file => console.log(`   - ${file}`))
    
    // Import từng collection
    const results = []
    
    console.log(`\n🔄 Bắt đầu import...`)
    
    for (const file of jsonFiles) {
      const collectionName = file.replace('.json', '')
      const result = await importCollection(db, collectionName, importDir)
      results.push(result)
    }
    
    // Tóm tắt
    console.log('\n' + '='.repeat(60))
    console.log('📊 TÓM TẮT IMPORT:')
    console.log('='.repeat(60))
    
    let totalImported = 0
    let totalSkipped = 0
    
    results.forEach(result => {
      if (result.skipped) {
        console.log(`   ⏭️  ${result.collection}: Bỏ qua`)
        totalSkipped++
      } else {
        console.log(`   ✅ ${result.collection}: ${result.count} documents`)
        totalImported += result.count
      }
    })
    
    console.log('='.repeat(60))
    console.log(`✅ Hoàn thành! Đã import ${totalImported} documents vào ${results.length - totalSkipped} collections`)
    if (totalSkipped > 0) {
      console.log(`⏭️  Đã bỏ qua ${totalSkipped} collections`)
    }
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Lỗi khi import database:', error)
    process.exit(1)
  } finally {
    // Đóng kết nối
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
      console.log('\n📤 Đã đóng kết nối MongoDB')
    }
  }
}

// Chạy import
if (require.main === module) {
  importDatabase()
    .then(() => {
      console.log('\n🎉 Import hoàn tất!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Import thất bại:', error)
      process.exit(1)
    })
}

module.exports = { importDatabase }

