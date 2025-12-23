const crypto = require('crypto');
const axios = require('axios');
const { getAxiosConfigWithProxy } = require('../utils/axiosProxy');

/**
 * Hash password theo cách Shopee
 */
function hashPassword(password) {
  const md5Hash = crypto.createHash("md5").update(password).digest("hex");
  const sha256Hash = crypto.createHash("sha256").update(md5Hash).digest("hex");
  return sha256Hash;
}

/**
 * Generate random device fingerprint
 */
function generateRandomDeviceFingerprint() {
  // Format: base64|base64|base64|08|3
  const part1 = crypto.randomBytes(16).toString('base64');
  const part2 = crypto.randomBytes(64).toString('base64');
  const part3 = crypto.randomBytes(8).toString('base64');
  return `${part1}|${part2}|${part3}|08|3`;
}

/**
 * Generate random CSRF token
 */
function generateCsrfToken(length = 32) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let index = 0; index < length; index++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

/**
 * Parse Set-Cookie headers và build cookie map
 */
function parseSetCookieHeaders(setCookieHeaders, cookieMap) {
  if (!setCookieHeaders) return;
  
  // Axios trả về Set-Cookie headers dưới dạng array hoặc string
  let headers = [];
  if (Array.isArray(setCookieHeaders)) {
    headers = setCookieHeaders;
  } else if (typeof setCookieHeaders === 'string') {
    // Nếu là string, có thể là nhiều cookies được join bằng comma
    // Nhưng Set-Cookie headers thường được trả về dưới dạng array
    headers = [setCookieHeaders];
  }
  
  for (const setCookie of headers) {
    if (!setCookie) continue;
    
    // Format: NAME=VALUE; Path=/; Domain=...; Expires=...; ...
    const semiIndex = setCookie.indexOf(';');
    const pair = semiIndex === -1 ? setCookie : setCookie.slice(0, semiIndex);
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const name = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (name && value) {
      cookieMap.set(name, value);
    }
  }
}

/**
 * Build cookie header từ cookie map
 */
function buildCookieHeaderFromMap(cookieMap) {
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

/**
 * Convert SPC_F cookie sang SPC_ST cookie (full cookie)
 * Logic: Sử dụng dummy phone/password để trigger login flow và lấy SPC_ST
 * @param {string} spcF - SPC_F cookie value
 * @param {string} phone - Phone number (optional, nếu không có sẽ dùng dummy)
 * @param {string} password - Password (optional, nếu không có sẽ dùng dummy)
 * @param {Object} proxyInfo - Proxy info (optional)
 * @returns {Promise<Object>} { success: boolean, cookieFull: string, spcSt: string, error?: string }
 */
async function convertSpcFToSpcSt(spcF, phone = null, password = null, proxyInfo = null) {
  try {
    if (!spcF) {
      return {
        success: false,
        error: 'SPC_F không được để trống',
        cookieFull: '',
        spcSt: '',
      };
    }

    const csrfToken = generateCsrfToken();
    const deviceFp = generateRandomDeviceFingerprint();
    
    const baseHeaders = {
      accept: 'application/json',
      'accept-language': 'vi-VN,vi;q=0.9',
      'content-type': 'application/json',
      origin: 'https://shopee.vn',
      priority: 'u=1, i',
      referer: 'https://shopee.vn/buyer/login?next=https%3A%2F%2Fshopee.vn%2F',
      'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      'x-api-source': 'pc',
      'x-csrftoken': csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      'x-shopee-language': 'vi',
      'x-sz-sdk-version': '1.12.22-1',
    };
    
    const loginUrl = 'https://shopee.vn/api/v4/account/login_by_password';
    const cookieMap = new Map();
    
    // Phải có phone và password để convert
    if (!phone || !password) {
      return {
        success: false,
        error: 'Cần có phone và password để convert SPC_F sang SPC_ST',
        cookieFull: spcF ? `SPC_F=${spcF}` : '',
        spcSt: '',
      };
    }

    const isPhone = /^\d+$/.test(phone);
    const phoneFormatted = isPhone ? (phone.startsWith('84') ? phone : `84${phone}`) : null;
    
    const requestBody = isPhone
      ? {
          phone: phoneFormatted,
          password: hashPassword(password),
          support_ivs: true,
          client_identifier: {
            security_device_fingerprint: deviceFp,
          },
        }
      : {
          username: phone,
          password: hashPassword(password),
          support_ivs: true,
          client_identifier: {
            security_device_fingerprint: deviceFp,
          },
        };
    
    const proxyConfig = getAxiosConfigWithProxy(proxyInfo);
    
    // First login call (không có SPC_F) - để lấy các cookies ban đầu
    console.log(`[CookieConverter] Making first login call for ${phone}...`);
    const firstResponse = await axios.post(loginUrl, requestBody, {
      headers: baseHeaders,
      ...proxyConfig,
      maxRedirects: 0, // Không follow redirects, giống như redirect: 'manual' trong fetch
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Chấp nhận cả redirect status codes
      },
    });
    
    // Parse cookies from first response
    // Axios có thể trả về Set-Cookie headers trong headers['set-cookie'] (lowercase) hoặc headers['Set-Cookie']
    // Có thể là array hoặc string
    const firstSetCookies = firstResponse.headers['set-cookie'] || firstResponse.headers['Set-Cookie'];
    console.log(`[CookieConverter] First call - Set-Cookie headers type:`, typeof firstSetCookies, Array.isArray(firstSetCookies) ? 'array' : 'not array');
    if (firstSetCookies) {
      parseSetCookieHeaders(firstSetCookies, cookieMap);
      console.log(`[CookieConverter] First call - Parsed cookies:`, Array.from(cookieMap.keys()));
    } else {
      console.log(`[CookieConverter] First call - No Set-Cookie headers found. Available headers:`, Object.keys(firstResponse.headers).filter(k => k.toLowerCase().includes('cookie')));
    }
    
    // Add SPC_F to cookie map
    cookieMap.set('SPC_F', spcF);
    
    // Second login call với SPC_F trong cookie header
    const cookieHeader = buildCookieHeaderFromMap(cookieMap);
    console.log(`[CookieConverter] Second call - Cookie header:`, cookieHeader.substring(0, 150));
    
    const secondResponse = await axios.post(loginUrl, requestBody, {
      headers: {
        ...baseHeaders,
        cookie: cookieHeader,
      },
      ...proxyConfig,
      maxRedirects: 0, // Không follow redirects
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Chấp nhận cả redirect status codes
      },
    });
    
    // Parse cookies from second response
    const secondSetCookies = secondResponse.headers['set-cookie'] || secondResponse.headers['Set-Cookie'];
    console.log(`[CookieConverter] Second call - Set-Cookie headers type:`, typeof secondSetCookies, Array.isArray(secondSetCookies) ? 'array' : 'not array');
    if (secondSetCookies) {
      // Log raw Set-Cookie headers để debug
      console.log(`[CookieConverter] Second call - Raw Set-Cookie headers:`, Array.isArray(secondSetCookies) ? secondSetCookies : [secondSetCookies]);
      parseSetCookieHeaders(secondSetCookies, cookieMap);
      console.log(`[CookieConverter] Second call - Parsed cookies:`, Array.from(cookieMap.keys()));
    } else {
      console.log(`[CookieConverter] Second call - No Set-Cookie headers found. Available headers:`, Object.keys(secondResponse.headers).filter(k => k.toLowerCase().includes('cookie')));
      // Thử log tất cả headers để debug
      console.log(`[CookieConverter] Second call - All headers keys:`, Object.keys(secondResponse.headers));
    }
    
    // Log tất cả cookies hiện có
    console.log(`[CookieConverter] Final cookie map:`, Object.fromEntries(cookieMap));
    console.log(`[CookieConverter] Second response status:`, secondResponse.status);
    console.log(`[CookieConverter] Second response data:`, JSON.stringify(secondResponse.data).substring(0, 200));
    
    // Get SPC_ST from cookie map
    // Shopee có thể trả về SPC_ST trong Set-Cookie hoặc trong response body
    let spcSt = cookieMap.get('SPC_ST') || '';
    
    // Nếu không có SPC_ST trong cookies, kiểm tra response body
    if (!spcSt && secondResponse.data) {
      const responseData = secondResponse.data;
      // Kiểm tra xem có cookie trong response body không
      if (typeof responseData === 'string' && responseData.includes('SPC_ST')) {
        const spcStMatch = responseData.match(/SPC_ST=([^;]+)/);
        if (spcStMatch) {
          spcSt = spcStMatch[1];
          cookieMap.set('SPC_ST', spcSt);
          console.log(`[CookieConverter] Found SPC_ST in response body`);
        }
      } else if (responseData.data && typeof responseData.data === 'string' && responseData.data.includes('SPC_ST')) {
        const spcStMatch = responseData.data.match(/SPC_ST=([^;]+)/);
        if (spcStMatch) {
          spcSt = spcStMatch[1];
          cookieMap.set('SPC_ST', spcSt);
          console.log(`[CookieConverter] Found SPC_ST in response.data`);
        }
      }
    }
    
    // Nếu vẫn không có SPC_ST, có thể Shopee không trả về nó trong login API
    // Trong trường hợp này, có thể cần sử dụng các cookies khác hoặc gọi API khác
    // Nhưng từ code index.js, có vẻ như SPC_ST sẽ được trả về trong Set-Cookie headers
    // Có thể vấn đề là cách parse Set-Cookie headers không đúng
    
    const cookieFull = buildCookieHeaderFromMap(cookieMap);
    
    if (!spcSt) {
      console.log(`[CookieConverter] Warning: No SPC_ST found. Available cookies:`, Array.from(cookieMap.keys()));
      console.log(`[CookieConverter] Second response headers:`, Object.keys(secondResponse.headers));
      
      // Thử kiểm tra lại Set-Cookie headers với các cách khác nhau
      const allHeaders = secondResponse.headers;
      for (const [key, value] of Object.entries(allHeaders)) {
        if (key.toLowerCase().includes('cookie') || key.toLowerCase().includes('set-cookie')) {
          console.log(`[CookieConverter] Found header ${key}:`, typeof value === 'string' ? value.substring(0, 200) : value);
        }
      }
      
      return {
        success: false,
        error: 'Không thể lấy SPC_ST từ cookie. Shopee có thể đã thay đổi cách trả về cookie hoặc cần phone/password hợp lệ.',
        cookieFull: cookieFull || `SPC_F=${spcF}`,
        spcSt: '',
        availableCookies: Array.from(cookieMap.keys()),
      };
    }
    
    return {
      success: true,
      cookieFull,
      spcSt,
      cookieMap: Object.fromEntries(cookieMap),
    };
  } catch (error) {
    console.error('Error converting SPC_F to SPC_ST:', error.message);
    return {
      success: false,
      error: error.message,
      cookieFull: spcF ? `SPC_F=${spcF}` : '',
      spcSt: '',
    };
  }
}

module.exports = {
  convertSpcFToSpcSt,
  hashPassword,
  generateRandomDeviceFingerprint,
  generateCsrfToken,
};

