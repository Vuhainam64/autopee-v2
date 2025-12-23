const axios = require('axios')

const KIOTPROXY_BASE_URL = 'https://api.kiotproxy.com/api/v1/proxies'

/**
 * Lấy proxy mới từ KiotProxy
 * @param {string} key - Proxy key
 * @param {string} region - Vùng: 'bac', 'trung', 'nam', 'random'
 * @returns {Promise<Object>} Thông tin proxy
 */
async function getNewProxy(key, region = 'random') {
  try {
    const response = await axios.get(`${KIOTPROXY_BASE_URL}/new`, {
      params: { key, region },
      timeout: 10000,
    })

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      }
    }

    return {
      success: false,
      error: response.data.message || 'Failed to get proxy',
      code: response.data.code,
    }
  } catch (error) {
    console.error('[ProxyService] Error getting new proxy:', error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
      code: error.response?.data?.code,
    }
  }
}

/**
 * Lấy thông tin proxy hiện tại
 * @param {string} key - Proxy key
 * @returns {Promise<Object>} Thông tin proxy
 */
async function getCurrentProxy(key) {
  try {
    const response = await axios.get(`${KIOTPROXY_BASE_URL}/current`, {
      params: { key },
      timeout: 10000,
    })

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      }
    }

    return {
      success: false,
      error: response.data.message || 'Failed to get current proxy',
      code: response.data.code,
    }
  } catch (error) {
    console.error('[ProxyService] Error getting current proxy:', error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
      code: error.response?.data?.code,
    }
  }
}

/**
 * Thoát proxy ra khỏi key
 * @param {string} key - Proxy key
 * @returns {Promise<Object>} Kết quả
 */
async function releaseProxy(key) {
  try {
    const response = await axios.get(`${KIOTPROXY_BASE_URL}/out`, {
      params: { key },
      timeout: 10000,
    })

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      }
    }

    return {
      success: false,
      error: response.data.message || 'Failed to release proxy',
      code: response.data.code,
    }
  } catch (error) {
    console.error('[ProxyService] Error releasing proxy:', error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unknown error',
      code: error.response?.data?.code,
    }
  }
}

/**
 * Lấy proxy cho một API endpoint
 * @param {string} apiEndpoint - API endpoint cần proxy (ví dụ: '/shopee/check-phone')
 * @returns {Promise<Object|null>} Proxy info hoặc null
 */
async function getProxyForApi(apiEndpoint) {
  const ProxyKey = require('../models/ProxyKey')
  
  try {
    // Tìm proxy key được cấu hình cho API này
    const proxyKey = await ProxyKey.findOne({
      isActive: true,
      usedByApis: { $in: [apiEndpoint] },
    }).sort({ createdAt: -1 })

    if (!proxyKey || !proxyKey.currentProxy) {
      return null
    }

    // Kiểm tra xem proxy còn hạn không
    const now = Date.now()
    if (proxyKey.currentProxy.expirationAt && proxyKey.currentProxy.expirationAt < now) {
      // Proxy đã hết hạn, cần lấy mới
      const newProxyResult = await getNewProxy(proxyKey.key, proxyKey.region)
      if (newProxyResult.success) {
        proxyKey.currentProxy = newProxyResult.data
        proxyKey.lastCheckedAt = new Date()
        await proxyKey.save()
        return newProxyResult.data
      }
      return null
    }

    return proxyKey.currentProxy
  } catch (error) {
    console.error('[ProxyService] Error getting proxy for API:', error.message)
    return null
  }
}

/**
 * Tự động đổi proxy cho các keys đã đến thời gian cho phép đổi
 * @returns {Promise<Object>} Kết quả
 */
async function autoRefreshExpiredProxies() {
  const ProxyKey = require('../models/ProxyKey')
  
  try {
    const now = Date.now()
    
    // Tìm tất cả proxy keys đang active
    const allKeys = await ProxyKey.find({
      isActive: true,
      currentProxy: { $exists: true, $ne: null },
    })

    // Lọc các keys đã đến thời gian cho phép đổi
    const keysToRefresh = allKeys.filter((key) => {
      const { expirationAt, nextRequestAt, ttc } = key.currentProxy
      
      // Đổi nếu proxy đã hết hạn
      if (expirationAt && expirationAt <= now) {
        return true
      }
      
      // Đổi nếu đã đến thời gian cho phép đổi (nextRequestAt)
      if (nextRequestAt && nextRequestAt <= now) {
        return true
      }
      
      // Đổi nếu ttc <= 0 (đã đến thời gian cho phép đổi)
      if (ttc !== undefined && ttc <= 0) {
        return true
      }
      
      return false
    })

    const results = {
      total: keysToRefresh.length,
      success: 0,
      failed: 0,
      errors: [],
    }

    for (const proxyKey of keysToRefresh) {
      try {
        const proxyResult = await getNewProxy(proxyKey.key, proxyKey.region)
        
        if (proxyResult.success) {
          proxyKey.currentProxy = proxyResult.data
          proxyKey.lastCheckedAt = new Date()
          await proxyKey.save()
          results.success++
        } else {
          results.failed++
          results.errors.push({
            key: proxyKey.key,
            error: proxyResult.error,
          })
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          key: proxyKey.key,
          error: error.message,
        })
      }
    }

    return results
  } catch (error) {
    console.error('[ProxyService] Error auto refreshing proxies:', error.message)
    return {
      total: 0,
      success: 0,
      failed: 0,
      errors: [{ error: error.message }],
    }
  }
}

module.exports = {
  getNewProxy,
  getCurrentProxy,
  releaseProxy,
  getProxyForApi,
  autoRefreshExpiredProxies,
}

