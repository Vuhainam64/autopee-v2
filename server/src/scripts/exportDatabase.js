/**
 * Script để export dữ liệu MongoDB ra file JSON
 * 
 * Cách sử dụng:
 * 1. Export biến môi trường (tùy chọn):
 *    - MONGODB_URI: MongoDB URI (mặc định: mongodb://localhost:27017/autopee)
 *    - EXPORT_DIR: Thư mục để lưu file export (mặc định: ./backup)
 * 
 * 2. Chạy script:
 *    node src/scripts/exportDatabase.js
 * 
 * Hoặc với npm:
 *    npm run export:database
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Danh sách các collections cần export
const COLLECTIONS_TO_EXPORT = [
  'users',
  'transactions',
  'paymentrequests',
  'usagehistories',
  'shopeecookies',
  'apitokens',
  'apipermissions',
  'routepermissions',
  'roles',
  'logconfigs',
  'serverlogs',
  'permissionhistories',
  'usersessions',
  'vouchershopee',
  'freeshipshopee',
  'proxykeys',
]

async function exportCollection(db, collectionName, exportDir) {
  try {
    console.log(`📦 Đang export collection: ${collectionName}`)
    
    // Đếm số documents
    const count = await db.collection(collectionName).countDocuments()
    console.log(`   Tìm thấy: ${count} documents`)
    
    if (count === 0) {
      console.log(`   ⏭️  Collection rỗng, bỏ qua`)
      return { collection: collectionName, count: 0, skipped: true }
    }
    
    // Lấy tất cả documents
    const documents = await db.collection(collectionName).find({}).toArray()
    
    // Chuyển đổi ObjectId thành string để JSON có thể serialize
    const jsonData = JSON.stringify(documents, null, 2)
    
    // Lưu vào file
    const filePath = path.join(exportDir, `${collectionName}.json`)
    fs.writeFileSync(filePath, jsonData, 'utf8')
    
    // Lưu metadata
    const metadata = {
      collection: collectionName,
      count: count,
      exportedAt: new Date().toISOString(),
      filePath: filePath,
    }
    
    console.log(`   ✅ Đã export: ${filePath}`)
    
    return { collection: collectionName, count: count, skipped: false, filePath: filePath }
  } catch (error) {
    console.error(`   ❌ Lỗi khi export ${collectionName}:`, error.message)
    throw error
  }
}

async function exportDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autopee'
  const exportDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'backup')
  
  console.log('🚀 Bắt đầu export database...')
  console.log(`📥 MongoDB URI: ${mongoUri}`)
  console.log(`📤 Export directory: ${exportDir}`)
  
  // Tạo thư mục export nếu chưa có
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
    console.log(`📁 Đã tạo thư mục: ${exportDir}`)
  }
  
  try {
    // Kết nối đến database
    console.log('\n📡 Đang kết nối đến MongoDB...')
    await mongoose.connect(mongoUri)
    const db = mongoose.connection.db
    
    console.log('✅ Đã kết nối thành công!\n')
    
    // Lấy danh sách collections thực tế
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log(`📋 Tìm thấy ${collectionNames.length} collections:`)
    collectionNames.forEach(name => console.log(`   - ${name}`))
    
    // Export từng collection
    const results = []
    const collectionsToExport = COLLECTIONS_TO_EXPORT.filter(name => 
      collectionNames.includes(name)
    )
    
    console.log(`\n🔄 Sẽ export ${collectionsToExport.length} collections...`)
    
    for (const collectionName of collectionsToExport) {
      const result = await exportCollection(db, collectionName, exportDir)
      results.push(result)
    }
    
    // Tạo file metadata tổng hợp
    const metadata = {
      exportedAt: new Date().toISOString(),
      sourceUri: mongoUri,
      exportDir: exportDir,
      collections: results.map(r => ({
        name: r.collection,
        count: r.count,
        skipped: r.skipped,
        filePath: r.filePath || null,
      })),
      summary: {
        totalCollections: results.length,
        totalDocuments: results.reduce((sum, r) => sum + r.count, 0),
        skippedCollections: results.filter(r => r.skipped).length,
      },
    }
    
    const metadataPath = path.join(exportDir, 'metadata.json')
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    console.log(`\n📄 Đã tạo file metadata: ${metadataPath}`)
    
    // Tóm tắt
    console.log('\n' + '='.repeat(60))
    console.log('📊 TÓM TẮT EXPORT:')
    console.log('='.repeat(60))
    
    let totalExported = 0
    let totalSkipped = 0
    
    results.forEach(result => {
      if (result.skipped) {
        console.log(`   ⏭️  ${result.collection}: Bỏ qua (rỗng)`)
        totalSkipped++
      } else {
        console.log(`   ✅ ${result.collection}: ${result.count} documents`)
        totalExported += result.count
      }
    })
    
    console.log('='.repeat(60))
    console.log(`✅ Hoàn thành! Đã export ${totalExported} documents từ ${results.length - totalSkipped} collections`)
    if (totalSkipped > 0) {
      console.log(`⏭️  Đã bỏ qua ${totalSkipped} collections rỗng`)
    }
    console.log(`📁 Tất cả file được lưu tại: ${exportDir}`)
    console.log('='.repeat(60))
    
    // Tạo file README hướng dẫn import
    const readmeContent = `# Database Export

## Thông tin Export

- **Ngày export**: ${new Date().toLocaleString('vi-VN')}
- **Source**: ${mongoUri}
- **Tổng số collections**: ${results.length}
- **Tổng số documents**: ${totalExported}

## Cách Import

### Cách 1: Sử dụng Script Import

\`\`\`bash
node src/scripts/importDatabase.js
\`\`\`

### Cách 2: Import thủ công

\`\`\`bash
# Import từng collection
mongoimport --uri="mongodb://new-server:27017/autopee" --collection=users --file=users.json --jsonArray
mongoimport --uri="mongodb://new-server:27017/autopee" --collection=transactions --file=transactions.json --jsonArray
# ... (lặp lại cho các collections khác)
\`\`\`

## Danh sách Collections

${results.map(r => `- ${r.collection}: ${r.count} documents${r.skipped ? ' (rỗng)' : ''}`).join('\n')}
`
    
    const readmePath = path.join(exportDir, 'README.md')
    fs.writeFileSync(readmePath, readmeContent, 'utf8')
    console.log(`\n📖 Đã tạo file README: ${readmePath}`)
    
  } catch (error) {
    console.error('\n❌ Lỗi khi export database:', error)
    process.exit(1)
  } finally {
    // Đóng kết nối
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
      console.log('\n📥 Đã đóng kết nối MongoDB')
    }
  }
}

// Chạy export
if (require.main === module) {
  exportDatabase()
    .then(() => {
      console.log('\n🎉 Export hoàn tất!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Export thất bại:', error)
      process.exit(1)
    })
}

module.exports = { exportDatabase }

