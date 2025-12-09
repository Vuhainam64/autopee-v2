# Firebase Cloud Functions - Autopee

Cấu trúc thư mục được tổ chức theo best practices của Firebase Cloud Functions.

## Cấu trúc thư mục

```
functions/
├── src/
│   ├── config/           # Firebase Admin SDK configuration
│   ├── utils/            # Utility functions (logger, errors, validators)
│   ├── services/         # Business logic layer
│   ├── handlers/         # Function handlers
│   │   ├── http/        # HTTP endpoints (REST API)
│   │   ├── callable/    # Callable functions
│   │   └── triggers/    # Firestore/Auth triggers
│   └── middleware/       # Authentication & error handling middleware
├── index.js              # Main entry point - exports all functions
└── package.json
```

## Cách sử dụng

### HTTP Functions
```javascript
// Call from client
fetch('https://your-region-your-project.cloudfunctions.net/getCurrentUser', {
  headers: {
    'Authorization': 'Bearer <firebase-id-token>'
  }
})
```

### Callable Functions
```javascript
// Call from client SDK
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()
const getUserProfile = httpsCallable(functions, 'getUserProfile')
const result = await getUserProfile()
```

## Development

```bash
# Install dependencies
npm install

# Run emulator
npm run serve

# Deploy functions
npm run deploy

# View logs
npm run logs
```

## Best Practices

1. **Separation of Concerns**: Business logic trong `services/`, handlers chỉ xử lý request/response
2. **Error Handling**: Sử dụng custom error classes và centralized error handler
3. **Validation**: Validate input data trước khi xử lý
4. **Authentication**: Sử dụng middleware để verify tokens
5. **Logging**: Structured logging với context

