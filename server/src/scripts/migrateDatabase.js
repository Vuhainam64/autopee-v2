/**
 * Script để migrate dữ liệu MongoDB từ server cũ sang server mới
 * 
 * Cách sử dụng:
 * 1. Export biến môi trường:
 *    - SOURCE_MONGODB_URI: MongoDB URI của server cũ (ví dụ: mongodb://old-server:27017/autopee)
 *    - TARGET_MONGODB_URI: MongoDB URI của server mới (ví dụ: mongodb://new-server:27017/autopee)
 * 
 * 2. Chạy script:
 *    node src/scripts/migrateDatabase.js
 * 
 * Hoặc với npm:
 *    SOURCE_MONGODB_URI="mongodb://old:27017/autopee" TARGET_MONGODB_URI="mongodb://new:27017/autopee" node src/scripts/migrateDatabase.js
 */

const mongoose = require('mongoose')

// Danh sách các collections cần migrate
const COLLECTIONS_TO_MIGRATE = [
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

async function migrateCollection(sourceDb, targetDb, collectionName) {
  try {
    console.log(`\n📦 Đang migrate collection: ${collectionName}`)
    
    // Đếm số documents trong source
    const sourceCount = await sourceDb.collection(collectionName).countDocuments()
    console.log(`   Source: ${sourceCount} documents`)
    
    if (sourceCount === 0) {
      console.log(`   ⏭️  Collection rỗng, bỏ qua`)
      return { collection: collectionName, count: 0, skipped: true }
    }
    
    // Lấy tất cả documents từ source
    const documents = await sourceDb.collection(collectionName).find({}).toArray()
    
    // Xóa collection cũ trong target (nếu có)
    const targetCollection = targetDb.collection(collectionName)
    const targetCount = await targetCollection.countDocuments()
    if (targetCount > 0) {
      console.log(`   ⚠️  Target đã có ${targetCount} documents, sẽ xóa và thay thế`)
      await targetCollection.deleteMany({})
    }
    
    // Insert documents vào target
    if (documents.length > 0) {
      await targetCollection.insertMany(documents)
    }
    
    // Verify
    const newTargetCount = await targetCollection.countDocuments()
    console.log(`   ✅ Target: ${newTargetCount} documents`)
    
    if (newTargetCount !== sourceCount) {
      throw new Error(`Số lượng documents không khớp! Source: ${sourceCount}, Target: ${newTargetCount}`)
    }
    
    return { collection: collectionName, count: newTargetCount, skipped: false }
  } catch (error) {
    console.error(`   ❌ Lỗi khi migrate ${collectionName}:`, error.message)
    throw error
  }
}

async function migrateDatabase() {
  const sourceUri = process.env.SOURCE_MONGODB_URI || 'mongodb://localhost:27017/autopee'
  const targetUri = process.env.TARGET_MONGODB_URI
  
  if (!targetUri) {
    console.error('❌ Lỗi: TARGET_MONGODB_URI không được cung cấp!')
    console.error('\nCách sử dụng:')
    console.error('  TARGET_MONGODB_URI="mongodb://new-server:27017/autopee" node src/scripts/migrateDatabase.js')
    console.error('\nHoặc set cả SOURCE và TARGET:')
    console.error('  SOURCE_MONGODB_URI="mongodb://old:27017/autopee" TARGET_MONGODB_URI="mongodb://new:27017/autopee" node src/scripts/migrateDatabase.js')
    process.exit(1)
  }
  
  console.log('🚀 Bắt đầu migrate database...')
  console.log(`📥 Source: ${sourceUri}`)
  console.log(`📤 Target: ${targetUri}`)
  console.log('\n⚠️  Cảnh báo: Dữ liệu trong target sẽ bị ghi đè!')
  
  let sourceConnection = null
  let targetConnection = null
  
  try {
    // Kết nối đến source database
    console.log('\n📡 Đang kết nối đến source database...')
    sourceConnection = await mongoose.createConnection(sourceUri)
    const sourceDb = sourceConnection.db
    
    // Kết nối đến target database
    console.log('📡 Đang kết nối đến target database...')
    targetConnection = await mongoose.createConnection(targetUri)
    const targetDb = targetConnection.db
    
    console.log('✅ Đã kết nối thành công!\n')
    
    // Lấy danh sách collections thực tế trong source
    const sourceCollections = await sourceDb.listCollections().toArray()
    const sourceCollectionNames = sourceCollections.map(c => c.name)
    
    console.log(`📋 Tìm thấy ${sourceCollectionNames.length} collections trong source:`)
    sourceCollectionNames.forEach(name => console.log(`   - ${name}`))
    
    // Migrate từng collection
    const results = []
    const collectionsToMigrate = COLLECTIONS_TO_MIGRATE.filter(name => 
      sourceCollectionNames.includes(name)
    )
    
    console.log(`\n🔄 Sẽ migrate ${collectionsToMigrate.length} collections...`)
    
    for (const collectionName of collectionsToMigrate) {
      const result = await migrateCollection(sourceDb, targetDb, collectionName)
      results.push(result)
    }
    
    // Tóm tắt
    console.log('\n' + '='.repeat(60))
    console.log('📊 TÓM TẮT MIGRATION:')
    console.log('='.repeat(60))
    
    let totalMigrated = 0
    let totalSkipped = 0
    
    results.forEach(result => {
      if (result.skipped) {
        console.log(`   ⏭️  ${result.collection}: Bỏ qua (rỗng)`)
        totalSkipped++
      } else {
        console.log(`   ✅ ${result.collection}: ${result.count} documents`)
        totalMigrated += result.count
      }
    })
    
    console.log('='.repeat(60))
    console.log(`✅ Hoàn thành! Đã migrate ${totalMigrated} documents từ ${results.length - totalSkipped} collections`)
    if (totalSkipped > 0) {
      console.log(`⏭️  Đã bỏ qua ${totalSkipped} collections rỗng`)
    }
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Lỗi khi migrate database:', error)
    process.exit(1)
  } finally {
    // Đóng kết nối
    if (sourceConnection) {
      await sourceConnection.close()
      console.log('\n📥 Đã đóng kết nối source')
    }
    if (targetConnection) {
      await targetConnection.close()
      console.log('📤 Đã đóng kết nối target')
    }
  }
}

// Chạy migration
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('\n🎉 Migration hoàn tất!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Migration thất bại:', error)
      process.exit(1)
    })
}

module.exports = { migrateDatabase }

