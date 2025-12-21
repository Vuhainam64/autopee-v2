const crypto = require('crypto')
const ServerLog = require('../models/ServerLog')

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
  // Bỏ qua health check endpoint
  if (req.path === '/' && req.method === 'GET') {
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

module.exports = { requestLogger, logError }

