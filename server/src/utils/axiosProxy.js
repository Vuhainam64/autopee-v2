const { HttpsProxyAgent } = require('https-proxy-agent')
const { HttpProxyAgent } = require('http-proxy-agent')

/**
 * Tạo axios config với proxy
 * @param {Object} proxyInfo - Thông tin proxy từ ProxyKey.currentProxy
 * @returns {Object} Axios config object
 */
function getAxiosConfigWithProxy(proxyInfo) {
  if (!proxyInfo) {
    return {}
  }

  // Ưu tiên sử dụng HTTP proxy
  if (proxyInfo.http) {
    const [host, port] = proxyInfo.http.split(':')
    const proxyUrl = `http://${host}:${port}`
        
    try {
      return {
        // Không dùng proxy config của axios vì nó có vấn đề với HTTPS
        // Thay vào đó dùng agent trực tiếp
        httpAgent: new HttpProxyAgent(proxyUrl),
        httpsAgent: new HttpsProxyAgent(proxyUrl),
      }
    } catch (error) {
      console.error(`[Proxy] Error creating proxy agents:`, error.message)
      return {}
    }
  }

  // Fallback: sử dụng SOCKS5 nếu không có HTTP
  if (proxyInfo.socks5) {
    const [host, port] = proxyInfo.socks5.split(':')
    console.log(`[Proxy] SOCKS5 proxy not yet supported: ${host}:${port}`)
    // Axios không hỗ trợ SOCKS5 trực tiếp, cần dùng socks-proxy-agent
    // Tạm thời return empty object, có thể cài thêm package sau
    return {}
  }

  return {}
}

module.exports = {
  getAxiosConfigWithProxy,
}

