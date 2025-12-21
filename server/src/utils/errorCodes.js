/**
 * Error codes mapping
 * Client chỉ nhận errorCode + traceId, không nhận message thật
 */
const ERROR_CODES = {
  // Authentication errors
  AUTH_FAILED: 'Đăng nhập thất bại',
  AUTH_TOKEN_INVALID: 'Token không hợp lệ',
  AUTH_TOKEN_EXPIRED: 'Token đã hết hạn',
  AUTH_REQUIRED: 'Yêu cầu đăng nhập',
  AUTH_FORBIDDEN: 'Không có quyền truy cập',
  USER_DISABLED: 'Tài khoản đã bị vô hiệu hóa',
  
  // Validation errors
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  MISSING_FIELD: 'Thiếu thông tin bắt buộc',
  
  // Resource errors
  NOT_FOUND: 'Không tìm thấy',
  ALREADY_EXISTS: 'Đã tồn tại',
  
  // Server errors
  INTERNAL_ERROR: 'Lỗi hệ thống',
  DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
  SERVICE_UNAVAILABLE: 'Dịch vụ tạm thời không khả dụng',
  
  // Permission errors
  PERMISSION_DENIED: 'Không có quyền thực hiện',
  ROLE_INSUFFICIENT: 'Quyền không đủ',
  
  // Rate limit
  RATE_LIMIT_EXCEEDED: 'Vượt quá giới hạn yêu cầu',
}

/**
 * Map error to error code
 */
function getErrorCode(error) {
  // Nếu error đã có errorCode
  if (error.errorCode) {
    return error.errorCode
  }
  
  // Map theo error name/code
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return 'VALIDATION_ERROR'
  }
  
  if (error.name === 'MongoServerError' || error.name === 'MongoError') {
    return 'DATABASE_ERROR'
  }
  
  if (error.statusCode === 401 || error.message?.includes('token')) {
    return 'AUTH_TOKEN_INVALID'
  }
  
  if (error.statusCode === 403) {
    return 'AUTH_FORBIDDEN'
  }
  
  if (error.statusCode === 404) {
    return 'NOT_FOUND'
  }
  
  if (error.statusCode === 429) {
    return 'RATE_LIMIT_EXCEEDED'
  }
  
  // Default
  return 'INTERNAL_ERROR'
}

/**
 * Get user-friendly message from error code
 */
function getErrorMessage(errorCode) {
  return ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR
}

module.exports = {
  ERROR_CODES,
  getErrorCode,
  getErrorMessage,
}

