import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadData() {
  console.log("Loading data...");
  // Implement logic load data ở đây
}

function generateRandomHash() {
  return crypto.randomBytes(16).toString('hex');
}

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

// Hàm lấy SPC_SC_SESSION từ cookie
async function getSPCSCSession(spcStCookie) {
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
    const response = await axios.get(
      'https://banhang.shopee.vn/portal/vn-onboarding/form/291000/291100',
      {
        headers: headers,
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

async function checkForgotPass(phone) {
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
    phone: `84${phone}`,
    password,
    support_ivs: true,
  };

  try {
    let response = await axios.post(
      "https://shopee.vn/api/v4/account/login_by_password",
      jsonData,
      {
        headers,
      }
    );
    return {
      response: response.data,
    };
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      return {
        error: error.message,
        responseData: error.response?.data,
        status: error.response?.status,
      };
    }
    return {
      error: error.message,
    };
  }
}

async function checkPhoneExist(phone, cookie) {
  try {
    const forgotData = await checkForgotPass(phone);

    // Xử lý cả trường hợp response và responseData
    const responseData = forgotData.response || forgotData.responseData;
    if (!responseData) {
      return {
        result: "false",
        error_msg: "Không nhận được response từ checkForgotPass",
      };
    }

    const error = responseData.error;
    console.log("forgotData error: ", error);

    if (error === 9) {
      return {
        result: "false",
        error_msg: "Tài khoản bị khoá",
      };
    }

    if (error === 2 || error === 89) {
      if (error === 89) {
        loadData();
        return {
          result: "false",
          error_msg: "Lỗi 89",
        };
      }

      // Sử dụng cookie được truyền vào (đã có SPC_SC_SESSION)
      const cookieHeaders = {
        authority: "banhang.shopee.vn",
        accept: "application/json, text/plain, */*",
        "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
        "content-type": "application/json;charset=UTF-8",
        cookie: cookie,
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
        phone: `84${phone}`,
        lang: "vi",
      };

      try {
        const phoneExistData = await axios.post(
          "https://banhang.shopee.vn/api/onboarding/local_onboard/v1/vn_onboard/phone/check/",
          json_data,
          {
            headers: cookieHeaders,
          }
        );

        console.log("phoneExistData: ", phoneExistData.data);

        if (responseData.error_msg === "token not found") {
          loadData();
          return {
            result: "false",
            error_msg: "Data Update",
          };
        }

        if (responseData.user_msg) {
          return {
            result: "false",
            error_msg: "Tài khoản tồn tại",
          };
        }

        if (phoneExistData.data === "OK") {
          return {
            result: "true",
            error_msg: "Tài khoản chưa tồn tại",
          };
        }

        return {
          result: "false",
          error_msg: `Response: ${JSON.stringify(phoneExistData.data)}`,
        };
      } catch (apiError) {
        console.error("API Error:", apiError.message);
        if (apiError.response) {
          console.error("Response status:", apiError.response.status);
          console.error("Response data:", JSON.stringify(apiError.response.data));
          
          if (apiError.response.status === 403) {
            return {
              result: "false",
              error_msg: "Cookie không hợp lệ hoặc đã hết hạn (403 Forbidden)",
            };
          }
        }
        
        return {
          result: "false",
          error_msg: `API Error: ${apiError.message}`,
        };
      }
    }

    return {
      result: "false",
      error_msg: `Error code: ${error}`,
    };
  } catch (error) {
    console.error("Error:", error.message);
    loadData();
    return {
      result: "false",
      error_msg: "Update Data",
    };
  }
}

async function checkPhone(phone, cookie) {
  const headers = {
    authority: "banhang.shopee.vn",
    accept: "application/json, text/plain, */*",
    "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
    "content-type": "application/json;charset=UTF-8",
    cookie: cookie,
    origin: "https://banhang.shopee.vn",
    referer: "https://banhang.shopee.vn/portal/vn-onboarding/form/291000/291100",
    "sc-fe-ver": "21.44522",
    "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  const json_data = {
    phone: `84${phone}`,
    lang: "vi",
  };

  try {
    const response = await axios.post(
      "https://banhang.shopee.vn/api/onboarding/local_onboard/v1/vn_onboard/phone/check/",
      json_data,
      {
        headers: headers,
      }
    );

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        data: error.response.data,
        message: error.message,
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

// Test
(async () => {
  const phone = "833730222";
  const spcStCookie = "SPC_ST=.eFc5c0YyUnZyRUF1bUFXZcytRxSPykuzTXvg5pqvbqYZIgZ6VO1H3F2Oh+vMiW9gQNEPqFTzow+WKMyORb42vWqjcjsvniJ6V5RwTFxH/O8tX+eXyLJAfs8T90IgcqDplU/12RD4dLKnXbRGVO1QR29X2s5FR2fdblG3i6947MczDlf4wEe0ZDBb+autE+3cCTGOwrLkdJI+vb0DgWK2fgylOzj4gAiygNrU5SuaXamAYeEdG2oOb1R+aam0Dh7mTV/jpON6/LMTkFiEAx+Dmw==";

  // Lấy SPC_SC_SESSION trước
  console.log("🔍 Đang lấy SPC_SC_SESSION...");
  console.log("=".repeat(50));
  const sessionResult = await getSPCSCSession(spcStCookie);
  const fullCookie = buildFullCookieString(spcStCookie, sessionResult);
  
  console.log("\n" + "=".repeat(50));
  console.log(`Đang kiểm tra số điện thoại: ${phone}`);
  console.log("=".repeat(50));

  // Sử dụng checkPhoneExist với logic đầy đủ
  const result = await checkPhoneExist(phone, fullCookie);

  console.log("\nKết quả check phone exist:");
  console.log(JSON.stringify(result, null, 2));

  // Ghi response ra file
  const filename = `response.json`;
  const filepath = path.join(__dirname, filename);

  const outputData = {
    phone: phone,
    timestamp: new Date().toISOString(),
    spcStCookie: spcStCookie,
    spcScSession: sessionResult,
    fullCookie: fullCookie,
    checkPhoneExistResult: result,
  };

  fs.writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`\n✅ Đã lưu response vào file: ${filename}`);
})();

export { 
  checkPhone, 
  checkPhoneExist, 
  checkForgotPass,
  getSPCSCSession, 
  buildFullCookieString 
};
