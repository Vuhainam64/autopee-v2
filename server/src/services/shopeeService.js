const axios = require("axios");
const crypto = require("crypto");
const { getAxiosConfigWithProxy } = require("../utils/axiosProxy");
const proxyService = require("./proxyService");

// Hàm parse cookie từ Set-Cookie header
function parseCookieFromHeaders(setCookieHeaders) {
  if (!setCookieHeaders) return null;
  
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  const cookieMap = {};
  
  cookies.forEach(cookie => {
    // Lấy phần đầu tiên (trước dấu ;) để lấy name=value
    const cookiePart = cookie.split(';')[0].trim();
    // Tìm vị trí dấu = đầu tiên để tách name và value
    const equalIndex = cookiePart.indexOf('=');
    if (equalIndex > 0) {
      const name = cookiePart.substring(0, equalIndex).trim();
      const value = cookiePart.substring(equalIndex + 1).trim();
      cookieMap[name] = value;
    }
  });
  
  return cookieMap;
}

// Hàm lấy SPC_SC_SESSION từ cookie SPC_ST
async function getSPCSCSession(spcStCookie, proxyInfo = null) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'cache-control': 'max-age=0',
    'if-none-match': 'W/"66c2a364a46280e15cf945bd99ddfe6b"',
    'priority': 'u=0, i',
    'referer': 'https://banhang.shopee.vn/portal-cache-sw.js?sw_config=%7B%22offAPICache%22%3A0%2C%22offResourcesCache%22%3A0%2C%22offHtmlCache%22%3A0%2C%22cacheSizeThreshold%22%3A150%2C%22reportSampleRatio%22%3A0.05%7D',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'upgrade-insecure-requests': '1',
    'Cookie': spcStCookie,
  };

  try {
    const proxyConfig = getAxiosConfigWithProxy(proxyInfo)
    const response = await axios.get(
      'https://banhang.shopee.vn/portal/vn-onboarding/form/291000/291100',
      { 
        headers,
        ...proxyConfig,
      }
    );

    // Lấy cookie từ response headers
    const setCookieHeaders = response.headers['set-cookie'];
    const cookieMap = parseCookieFromHeaders(setCookieHeaders);
    
    if (cookieMap && cookieMap['SPC_SC_SESSION']) {
      return {
        success: true,
        spcScSession: cookieMap['SPC_SC_SESSION'],
        allCookies: cookieMap,
        fullCookieString: Object.entries(cookieMap).map(([key, value]) => `${key}=${value}`).join('; '),
      };
    }

    return {
      success: false,
      message: 'Không tìm thấy SPC_SC_SESSION trong response',
      allCookies: cookieMap,
    };
  } catch (error) {
    if (error.response) {
      const setCookieHeaders = error.response.headers['set-cookie'];
      const cookieMap = parseCookieFromHeaders(setCookieHeaders);
      
      return {
        success: false,
        status: error.response.status,
        message: error.message,
        allCookies: cookieMap,
        spcScSession: cookieMap && cookieMap['SPC_SC_SESSION'] ? cookieMap['SPC_SC_SESSION'] : null,
      };
    }
    
    return {
      success: false,
      message: error.message,
    };
  }
}

// Hàm tạo cookie string đầy đủ từ SPC_ST và các cookies khác
function buildFullCookieString(spcStCookie, sessionResult) {
  let cookieString = spcStCookie;
  
  if (sessionResult && sessionResult.success && sessionResult.allCookies) {
    const cookies = sessionResult.allCookies;
    
    // Thêm các cookies quan trọng vào cookie string
    const importantCookies = ['SPC_SC_SESSION', 'SPC_SC_MAIN_SHOP_SA_UD', 'SPC_STK', 'SC_DFP', 'SPC_SEC_SI', 'SPC_SI'];
    
    importantCookies.forEach(cookieName => {
      if (cookies[cookieName] && !cookieString.includes(cookieName)) {
        cookieString += `; ${cookieName}=${cookies[cookieName]}`;
      }
    });
  }
  
  return cookieString;
}

const UA_WEB =
  "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 ShopeeApp";

const HEADERS_GET = {
  "User-Agent": UA_WEB,
  Accept: "application/json",
  "Accept-Language": "vi-VN,vi;q=0.9",
  Origin: "https://shopee.vn",
  Referer: "https://shopee.vn/",
};

const HEADERS_POST_JSON = {
  ...HEADERS_GET,
  "Content-Type": "application/json",
};

const fetchAllOrdersAndCheckouts = async (
  cookie,
  { limit = 10, listType = 7, offset = 0 } = {},
  proxyInfo = null,
) => {
  const url =
    "https://mall.shopee.vn/api/v4/order/get_all_order_and_checkout_list" +
    `?_oft=3&limit=${limit}&list_type=${listType}&offset=${offset}`;
  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    Cookie: cookie,
  };

  const proxyConfig = getAxiosConfigWithProxy(proxyInfo)
  const resp = await axios.get(url, { 
    headers,
    ...proxyConfig,
  });
  if (!resp.data || resp.data.error !== 0) {
    throw new Error(resp.data?.error_msg || "Shopee API error");
  }
  return resp.data.data;
};

const fetchOrderDetailV2 = async (cookie, orderId, proxyInfo = null) => {
  const url =
    "https://mall.shopee.vn/api/v4/order/get_order_detail_v2?_oft=3&order_id=" +
    orderId;
  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    Cookie: cookie,
  };

  const proxyConfig = getAxiosConfigWithProxy(proxyInfo)
  const resp = await axios.get(url, { 
    headers,
    ...proxyConfig,
  });
  if (!resp.data || resp.data.error !== 0) {
    throw new Error(resp.data?.error_msg || "Shopee order detail error");
  }
  return resp.data.data;
};

const genQrCode = async () => {
  const resp = await axios.get(
    "https://shopee.vn/api/v2/authentication/gen_qrcode",
    {
      headers: HEADERS_GET,
    },
  );
  if (resp.status === 200 && resp.data?.data) return resp.data.data;
  throw new Error("Failed to generate QR");
};

const checkQrStatus = async (qrcodeId) => {
  const url =
    "https://shopee.vn/api/v2/authentication/qrcode_status" +
    `?qrcode_id=${encodeURIComponent(qrcodeId)}`;
  const resp = await axios.get(url, { headers: HEADERS_GET });
  if (resp.status === 200 && resp.data) return resp.data;
  throw new Error("Failed to check QR status");
};

const loginQr = async (qrcodeToken) => {
  const fingerprint =
    "OazXiPqlUgm158nr1h09yA==|0/eMoV7m/rlUHbgxsRgRC/n0vyOe6XzhDMa2PcnZPv3ecioRaJQg2W7ur5GfhoDDEeuMz2az7GGj/8Y=|Pu2hbrwoH+45rDNC|08|3";
  const payload = {
    qrcode_token: qrcodeToken,
    device_sz_fingerprint: fingerprint,
    client_identifier: {
      security_device_fingerprint: fingerprint,
    },
  };
  const resp = await axios.post(
    "https://shopee.vn/api/v2/authentication/qrcode_login",
    payload,
    { headers: HEADERS_POST_JSON },
  );
  const setCookie = resp.headers?.["set-cookie"] || [];
  const pick =
    setCookie.find((c) => c.includes("SPC_ST")) ||
    setCookie.find((c) => c.includes("SPC_T_ID")) ||
    setCookie.find((c) => c.includes("SPC_R_T_ID")) ||
    setCookie[0];
  if (!pick) {
    return { cookie: "", cookies: setCookie, raw: resp.data };
  }
  const joined = setCookie.map((c) => c.split(";")[0]).join("; ");
  return {
    cookie: pick.split(";")[0],
    cookies: setCookie,
    cookieFull: joined,
    raw: resp.data,
  };
};

// Hàm generate random hash cho password
const generateRandomHash = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Hàm check số điện thoại có tồn tại trên Shopee hay không
// cookie: optional, nếu có sẽ dùng để check chính xác hơn khi error === 2 hoặc 89
// proxyInfo: optional, thông tin proxy để sử dụng
const checkPhone = async (phone, cookie = null, proxyInfo = null) => {
  // Loại bỏ các ký tự không phải số
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  
  // Xóa số 0 ở đầu nếu có
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  if (!cleanPhone) {
    throw new Error("Số điện thoại không hợp lệ");
  }

  const headers = {
    authority: "shopee.vn",
    accept: "application/json",
    "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
    "content-type": "application/json",
    origin: "https://shopee.vn",
    "sec-ch-ua":
      '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "x-api-source": "pc",
    "x-requested-with": "XMLHttpRequest",
    "x-shopee-language": "vi",
    "x-sz-sdk-version": "1.7.9",
  };

  const password = generateRandomHash();
  const jsonData = {
    phone: `84${cleanPhone}`,
    password,
    support_ivs: true,
  };

  try {
    const proxyConfig = getAxiosConfigWithProxy(proxyInfo)
    const response = await axios.post(
      "https://shopee.vn/api/v4/account/login_by_password",
      jsonData,
      { 
        headers,
        ...proxyConfig,
      }
    );

    const responseData = response.data;
    const error = responseData.error;

    // Error code meanings:
    // - error === 2: Cần check thêm với cookie để xác định chính xác
    // - error === 9: Tài khoản bị khóa
    // - error === 89: Cần check thêm với cookie để xác định chính xác
    // - Không có error hoặc error === 0: Số điện thoại chưa tồn tại

    if (error === 9) {
      return {
        phone: cleanPhone,
        exists: true,
        message: "Tài khoản bị khóa",
        errorCode: error,
      };
    }

    // Khi error === 2 hoặc 89, cần check thêm với cookie để xác định chính xác
    if ((error === 2 || error === 89) && cookie) {
      // Bước quan trọng: Lấy SPC_SC_SESSION và build full cookie string (giống checkphone2.js)
      let fullCookie = cookie;
      try {
        // Kiểm tra xem cookie có chứa SPC_SC_SESSION chưa
        if (!cookie.includes('SPC_SC_SESSION')) {
          // Tách SPC_ST từ cookie (có thể cookie có nhiều cookies, lấy SPC_ST đầu tiên)
          const spcStMatch = cookie.match(/SPC_ST=[^;]+/);
          if (spcStMatch) {
            const spcStCookie = spcStMatch[0];
            const sessionResult = await getSPCSCSession(spcStCookie, proxyInfo);
            if (sessionResult && sessionResult.success) {
              fullCookie = buildFullCookieString(spcStCookie, sessionResult);
            }
          }
        }
      } catch (sessionError) {
        // Tiếp tục với cookie gốc nếu không lấy được SPC_SC_SESSION
      }
      
      try {
        const cookieHeaders = {
          authority: "banhang.shopee.vn",
          accept: "application/json, text/plain, */*",
          "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
          "content-type": "application/json;charset=UTF-8",
          cookie: fullCookie,
          origin: "https://banhang.shopee.vn",
          referer: "https://banhang.shopee.vn/portal/vn-onboarding/form/291000/291100",
          "sc-fe-ver": "21.44522",
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        };

        const json_data = {
          phone: `84${cleanPhone}`,
          lang: "vi",
        };

        const proxyConfig = getAxiosConfigWithProxy(proxyInfo)
        const phoneExistResponse = await axios.post(
          "https://banhang.shopee.vn/api/onboarding/local_onboard/v1/vn_onboard/phone/check/",
          json_data,
          { 
            headers: cookieHeaders,
            ...proxyConfig,
          }
        );

        // Nếu response là "OK", số điện thoại chưa tồn tại
        if (phoneExistResponse.data === "OK") {
          return {
            phone: cleanPhone,
            exists: false,
            message: "Số điện thoại chưa tồn tại trên Shopee",
            errorCode: error,
          };
        }

        // Nếu có data khác, số điện thoại đã tồn tại
        return {
          phone: cleanPhone,
          exists: true,
          message: "Số điện thoại đã tồn tại trên Shopee",
          errorCode: error,
        };
      } catch (apiError) {
        if (apiError.response) {
          const errorData = apiError.response.data;
          const status = apiError.response.status;
          
          // Nếu status 400 và có user_msg, số điện thoại đã tồn tại
          if (status === 400 && errorData?.user_msg) {
            return {
              phone: cleanPhone,
              exists: true,
              message: errorData.user_msg || "Số điện thoại đã tồn tại trên Shopee",
              errorCode: error,
            };
          }
          
          // Nếu status 403, cookie không hợp lệ - trả về kết quả từ bước 1 và đánh dấu cookie không hợp lệ
          if (status === 403) {
            // Nếu error === 2, số điện thoại đã tồn tại
            if (error === 2) {
              return {
                phone: cleanPhone,
                exists: true,
                message: "Số điện thoại đã tồn tại trên Shopee (lỗi dữ liệu, không thể xác định chính xác)",
                errorCode: error,
                invalidCookie: true, // Đánh dấu cookie không hợp lệ
              };
            }
            return {
              phone: cleanPhone,
              exists: false,
              message: "lỗi dữ liệu, không thể xác định chính xác",
              errorCode: error,
              invalidCookie: true, // Đánh dấu cookie không hợp lệ
            };
          }
        }
        
        // Nếu không có cookie hoặc cookie không hợp lệ, trả về kết quả từ forgot pass
        if (error === 2) {
          return {
            phone: cleanPhone,
            exists: true,
            message: "Số điện thoại đã tồn tại trên Shopee [Mã 2]",
            errorCode: error,
          };
        }
        
        if (error === 89) {
          return {
            phone: cleanPhone,
            exists: false,
            message: "Lỗi rate limit, vui lòng thử lại sau",
            errorCode: error,
          };
        }
      }
    }

    // Nếu error === 2 nhưng không có cookie, trả về đã tồn tại
    if (error === 2) {
      return {
        phone: cleanPhone,
        exists: true,
        message: "Số điện thoại đã tồn tại trên Shopee [Mã 2]",
        errorCode: error,
      };
    }

    if (error === 89) {
      return {
        phone: cleanPhone,
        exists: false,
        message: "Lỗi rate limit, vui lòng thử lại sau",
        errorCode: error,
      };
    }

    // Không có error hoặc error === 0 nghĩa là số điện thoại chưa tồn tại
    return {
      phone: cleanPhone,
      exists: false,
      message: "Số điện thoại chưa tồn tại trên Shopee",
      errorCode: error || 0,
    };
  } catch (error) {
    if (error.response) {
      const responseData = error.response.data;
      const errorCode = responseData?.error;

      if (errorCode === 2) {
        return {
          phone: cleanPhone,
          exists: true,
          message: "Số điện thoại đã tồn tại trên Shopee",
          errorCode: errorCode,
        };
      }

      if (errorCode === 9) {
        return {
          phone: cleanPhone,
          exists: true,
          message: "Tài khoản bị khóa",
          errorCode: errorCode,
        };
      }

      return {
        phone: cleanPhone,
        exists: false,
        message: responseData?.error_msg || "Lỗi khi kiểm tra số điện thoại",
        errorCode: errorCode,
      };
    }

    throw new Error(error.message || "Lỗi khi kiểm tra số điện thoại");
  }
};

module.exports = {
  fetchAllOrdersAndCheckouts,
  fetchOrderDetailV2,
  genQrCode,
  checkQrStatus,
  loginQr,
  checkPhone,
  HEADERS_GET,
  HEADERS_POST_JSON,
};


