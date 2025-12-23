# Database Export

## Thông tin Export

- **Ngày export**: 12:13:40 23/12/2025
- **Source**: mongodb://localhost:27017/autopee
- **Tổng số collections**: 16
- **Tổng số documents**: 6625

## Cách Import

### Cách 1: Sử dụng Script Import

```bash
node src/scripts/importDatabase.js
```

### Cách 2: Import thủ công

```bash
# Import từng collection
mongoimport --uri="mongodb://new-server:27017/autopee" --collection=users --file=users.json --jsonArray
mongoimport --uri="mongodb://new-server:27017/autopee" --collection=transactions --file=transactions.json --jsonArray
# ... (lặp lại cho các collections khác)
```

## Danh sách Collections

- users: 54 documents
- transactions: 6 documents
- paymentrequests: 11 documents
- usagehistories: 14 documents
- shopeecookies: 186 documents
- apitokens: 2 documents
- apipermissions: 41 documents
- routepermissions: 15 documents
- roles: 5 documents
- logconfigs: 1 documents
- serverlogs: 6121 documents
- permissionhistories: 54 documents
- usersessions: 103 documents
- vouchershopee: 3 documents
- freeshipshopee: 8 documents
- proxykeys: 1 documents
