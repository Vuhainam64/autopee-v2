/**
 * Middleware để verify SePay Webhook
 * Hỗ trợ 3 loại authentication:
 * 1. API Key (header: Authorization: Apikey YOUR_API_KEY)
 * 2. OAuth 2.0 (có thể implement sau)
 * 3. Không cần chứng thực (whitelist IP)
 */

/**
 * Verify API Key từ header
 */
const verifyApiKey = (req) => {
  const authHeader = req.headers.authorization || ''
  
  if (!authHeader.startsWith('Apikey ')) {
    return null
  }
  
  const apiKey = authHeader.replace('Apikey ', '')
  
  // Lấy API Key từ environment variable
  const validApiKey = process.env.SEPAY_WEBHOOK_KEY
  
  if (!validApiKey) {
    // Nếu không có API Key config, từ chối (security)
    return false
  }
  
  return apiKey === validApiKey
}

/**
 * Verify IP whitelist (nếu không dùng API Key)
 */
const verifyIPWhitelist = (req) => {
  // TODO: Lấy IP whitelist từ environment variable hoặc database
  const whitelistIPs = process.env.SEPAY_IP_WHITELIST
    ? process.env.SEPAY_IP_WHITELIST.split(',')
    : []
  
  if (whitelistIPs.length === 0) {
    // Nếu không có whitelist, cho phép tất cả (development)
    return true
  }
  
  const clientIP = req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection.remoteAddress
  
  return whitelistIPs.includes(clientIP)
}

/**
 * Middleware để verify SePay webhook
 * Ưu tiên API Key, nếu không có thì dùng IP whitelist
 */
const verifySePayWebhook = (req, res, next) => {
  // Nếu có API Key trong header, verify API Key
  if (req.headers.authorization?.startsWith('Apikey ')) {
    const isValid = verifyApiKey(req)
    if (isValid === null) {
      // Không có format Apikey, có thể là format khác
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
      })
    }
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API Key',
      })
    }
    return next()
  }
  
  // Nếu không có API Key trong header, verify IP whitelist (nếu có config)
  const whitelistIPs = process.env.SEPAY_IP_WHITELIST
    ? process.env.SEPAY_IP_WHITELIST.split(',').map(ip => ip.trim())
    : []
  
  // Nếu có IP whitelist config, phải verify IP
  if (whitelistIPs.length > 0) {
    const isValidIP = verifyIPWhitelist(req)
    if (!isValidIP) {
      return res.status(403).json({
        success: false,
        message: 'IP not allowed',
      })
    }
    return next()
  }
  
  // Nếu không có cả API Key và IP whitelist config, từ chối (security)
  return res.status(401).json({
    success: false,
    message: 'Authentication required',
  })
}

module.exports = { verifySePayWebhook }

