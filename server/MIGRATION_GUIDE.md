# Hướng dẫn Migrate Database MongoDB

## Cách 1: Sử dụng Script Migration (Khuyến nghị)

Script này sẽ copy tất cả dữ liệu từ database cũ sang database mới.

### Bước 1: Chuẩn bị

Đảm bảo bạn có quyền truy cập vào cả 2 database:
- **Source database**: Database cũ (server hiện tại)
- **Target database**: Database mới (server mới)

### Bước 2: Chạy Migration

```bash
# Với npm script
SOURCE_MONGODB_URI="mongodb://old-server:27017/autopee" \
TARGET_MONGODB_URI="mongodb://new-server:27017/autopee" \
npm run migrate:database

# Hoặc trực tiếp với node
SOURCE_MONGODB_URI="mongodb://old-server:27017/autopee" \
TARGET_MONGODB_URI="mongodb://new-server:27017/autopee" \
node src/scripts/migrateDatabase.js
```

### Bước 3: Cập nhật MONGODB_URI

Sau khi migration xong, cập nhật biến môi trường `MONGODB_URI` trong file `.env` hoặc environment variables:

```env
MONGODB_URI=mongodb://new-server:27017/autopee
```

### Lưu ý:

- ⚠️ **Dữ liệu trong target database sẽ bị ghi đè!**
- ✅ Script sẽ tự động kiểm tra và báo cáo số lượng documents đã migrate
- 📋 Script sẽ migrate các collections sau:
  - users
  - transactions
  - paymentrequests
  - usagehistories
  - shopeecookies
  - apitokens
  - apipermissions
  - routepermissions
  - roles
  - logconfigs
  - serverlogs
  - permissionhistories
  - usersessions
  - vouchershopee
  - freeshipshopee
  - proxykeys

---

## Cách 2: Sử dụng mongodump và mongorestore

### Bước 1: Export dữ liệu từ server cũ

```bash
mongodump --uri="mongodb://old-server:27017/autopee" --out=./backup
```

### Bước 2: Import dữ liệu vào server mới

```bash
mongorestore --uri="mongodb://new-server:27017/autopee" ./backup/autopee
```

### Bước 3: Cập nhật MONGODB_URI

Cập nhật biến môi trường `MONGODB_URI` trong file `.env`:

```env
MONGODB_URI=mongodb://new-server:27017/autopee
```

---

## Cách 3: Sử dụng MongoDB Compass hoặc Studio 3T

1. Kết nối đến database cũ
2. Export tất cả collections
3. Kết nối đến database mới
4. Import các collections đã export

---

## Kiểm tra sau khi Migration

Sau khi migration, kiểm tra:

1. **Số lượng documents**: So sánh số lượng documents trong mỗi collection
2. **Dữ liệu quan trọng**: Kiểm tra một số records quan trọng
3. **Indexes**: Đảm bảo indexes đã được tạo (Mongoose sẽ tự động tạo khi app chạy)

```bash
# Kiểm tra số lượng documents
mongo "mongodb://new-server:27017/autopee" --eval "db.users.countDocuments()"
mongo "mongodb://new-server:27017/autopee" --eval "db.transactions.countDocuments()"
```

---

## Troubleshooting

### Lỗi kết nối

- Kiểm tra firewall và network
- Đảm bảo MongoDB đang chạy trên cả 2 server
- Kiểm tra authentication nếu có

### Lỗi permission

- Đảm bảo user có quyền read trên source database
- Đảm bảo user có quyền write trên target database

### Dữ liệu không khớp

- Chạy lại script migration
- Kiểm tra logs để xem collection nào bị lỗi
- Có thể migrate từng collection riêng lẻ

