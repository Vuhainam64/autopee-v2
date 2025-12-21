const crypto = require('crypto')
const ServerLog = require('../models/ServerLog')
const LogConfig = require('../models/LogConfig')

/**
 * Tạo hoặc lấy Trace ID từ request
 * Ưu tiên CF-Ray từ Cloudflare, nếu không có thì tự sinh
 */
function getTraceId(req) {
  // Ưu tiên CF-Ray từ Cloudflare
  if (req.headers['cf-ray']) {
    return `cf-${req.headers['cf-ray']}`
  }
  
  // Nếu đã có traceId trong request (từ middleware trước đó)
  if (req.traceId) {
    return req.traceId
  }
  
  // Tự sinh UUID v4
  return `req-${crypto.randomUUID().substring(0, 8)}`
}

/**
 * Lấy IP thực tế của client
 */
function getClientIP(req) {
  let clientIP = 'Unknown'
  
  // Ưu tiên x-forwarded-for (khi có proxy/load balancer)
  if (req.headers['x-forwarded-for']) {
    clientIP = req.headers['x-forwarded-for'].split(',')[0].trim()
  } 
  // X-real-ip (khi có nginx proxy)
  else if (req.headers['x-real-ip']) {
    clientIP = req.headers['x-real-ip']
  } 
  // req.ip (khi Express trust proxy)
  else if (req.ip) {
    clientIP = req.ip
  } 
  // req.socket.remoteAddress (fallback)
  else if (req.socket?.remoteAddress) {
    clientIP = req.socket.remoteAddress
  }
  // req.connection.remoteAddress (fallback cũ)
  else if (req.connection?.remoteAddress) {
    clientIP = req.connection.remoteAddress
  }
  
  // Chuyển IPv6 mapped IPv4 (::ffff:127.0.0.1) thành IPv4 (127.0.0.1)
  if (clientIP && clientIP.startsWith('::ffff:')) {
    clientIP = clientIP.replace('::ffff:', '')
  }
  
  // Chuyển ::1 (IPv6 localhost) thành 127.0.0.1 (IPv4 localhost)
  if (clientIP === '::1') {
    clientIP = '127.0.0.1'
  }
  
  return clientIP
}

/**
 * Middleware để log các request vào MongoDB
 */
const requestLogger = async (req, res, next) => {
  // Kiểm tra xem có nên bỏ qua log không
  const shouldSkip = await shouldSkipLogging(req)
  if (shouldSkip) {
    return next()
  }

  // Tạo traceId và gắn vào request
  const traceId = getTraceId(req)
  req.traceId = traceId
  
  // Gắn traceId vào response header để client có thể dùng
  res.setHeader('X-Trace-Id', traceId)

  // Lưu thông tin request để log sau khi response
  const startTime = Date.now()
  const originalSend = res.send

  res.send = function (data) {
    // Tính thời gian xử lý
    const duration = Date.now() - startTime

    // Lấy errorCode từ response nếu có
    let errorCode = null
    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data
      if (responseData?.errorCode) {
        errorCode = responseData.errorCode
      }
    } catch {
      // Ignore parse error
    }

    // Lấy thông tin request
    const logData = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      message: `${req.method} ${req.path} - ${res.statusCode}`,
      service: 'autopee-api',
      traceId,
      errorCode,
      userId: req.user?.uid || null,
      endpoint: req.path,
      method: req.method,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || null,
      metadata: {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        query: req.query,
        body: req.method !== 'GET' ? sanitizeBody(req.body) : null,
      },
    }

    // Log vào MongoDB (không block response)
    ServerLog.create(logData).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to log request:', err)
    })

    // Gọi original send
    return originalSend.call(this, data)
  }

  next()
}

/**
 * Log error vào MongoDB
 */
const logError = async (error, req, metadata = {}) => {
  try {
    const traceId = req?.traceId || getTraceId(req || {})
    const errorCode = error.errorCode || error.code || 'INTERNAL_ERROR'
    
    await ServerLog.create({
      level: 'error',
      message: error.message || 'Unknown error',
      service: 'autopee-api',
      traceId,
      errorCode,
      userId: req?.user?.uid || null,
      endpoint: req?.path || null,
      method: req?.method || null,
      ip: req ? getClientIP(req) : 'Unknown',
      userAgent: req?.headers?.['user-agent'] || null,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...metadata,
      },
    })
    
    return traceId
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to log error:', err)
    return null
  }
}

/**
 * Sanitize body để không log sensitive data
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body

  const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'key']
  const sanitized = { ...body }

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***'
    }
  }

  return sanitized
}

/**
 * Cache cho log configs
 * Refresh mỗi 5 phút
 */
let logConfigsCache = []
let logConfigsCacheTime = 0
const LOG_CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 phút

/**
 * Lấy danh sách log configs từ cache hoặc database
 */
async function getLogConfigs() {
  const now = Date.now()
  
  // Nếu cache còn valid, trả về cache
  if (logConfigsCache.length > 0 && (now - logConfigsCacheTime) < LOG_CONFIG_CACHE_TTL) {
    return logConfigsCache
  }
  
  // Lấy từ database và update cache
  try {
    logConfigsCache = await LogConfig.find({ enabled: true }).lean()
    logConfigsCacheTime = now
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load log configs:', error)
    // Nếu lỗi, vẫn dùng cache cũ nếu có
    if (logConfigsCache.length === 0) {
      logConfigsCache = []
    }
  }
  
  return logConfigsCache
}

/**
 * Kiểm tra xem endpoint có nên bỏ qua log không
 */
async function shouldSkipLogging(req) {
  // Bỏ qua health check endpoint
  if (req.path === '/' && req.method === 'GET') {
    return true
  }
  
  // Lấy configs
  const configs = await getLogConfigs()
  
  // Kiểm tra từng config
  for (const config of configs) {
    // Kiểm tra method
    if (config.method !== 'ALL' && config.method !== req.method) {
      continue
    }
    
    // Kiểm tra pattern
    try {
      // Nếu pattern bắt đầu với ^ hoặc chứa regex, dùng như regex
      // Nếu không, convert thành regex bằng cách replace :param thành [^/]+
      let regexPattern
      if (config.pattern.startsWith('^') || config.pattern.includes('(')) {
        // Đã là regex
        regexPattern = new RegExp(config.pattern)
      } else {
        // Convert path pattern thành regex
        // Ví dụ: /payment/deposit/:paymentCode/status -> ^/payment/deposit/[^/]+/status$
        regexPattern = new RegExp('^' + config.pattern.replace(/:[^/]+/g, '[^/]+') + '$')
      }
      
      if (regexPattern.test(req.path)) {
        return true // Match, bỏ qua log
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Invalid regex pattern in log config: ${config.pattern}`, error)
    }
  }
  
  return false
}

module.exports = { requestLogger, logError, getLogConfigs }

