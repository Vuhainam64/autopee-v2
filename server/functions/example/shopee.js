/* eslint-disable */
const express = require("express");
const router = express.Router();
const axios = require("axios");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cheerio = require("cheerio");
const admin = require("firebase-admin");
const {v4: uuidv4} = require("uuid");

const db = admin.firestore();
const fs = require("fs");

router.use(bodyParser.json());

axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3";

// const url = `https://script.google.com/macros/s/AKfycbzgGm0a9KfmyPI1QnAycYB5BqcTDfqQfZuWduSpeeFFrBDSbZFuPAhZM3rBAnuwnih8/exec?columnName=cot

// Order&Checkout List: https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=5&offset=0
// Order Detail: https://shopee.vn/api/v4/order/get_order_detail?order_id=124388457229298
// Order List: https://shopee.vn/api/v4/order/get_order_list?limit=5&list_type=4&offset=0
// get refund (POST): https://shopee.vn/api/v4/return/return_data/get_return_refund_list
// get account info: https://shopee.vn/api/v4/account/basic/get_account_info
// Image: https://cf.shopee.vn/file/ecd20c9d39e0c865d53e3f47e6e2e3a7

router.post("/search-address", async (req, res) => {
  try {
    const {text} = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Missing 'text' field in the request body.",
      });
    }

    const cookie =
      "session=eyJfcGVybWFuZW50Ijp0cnVlfQ.Ze2euA.7JUBhsLzPPL7cxH-cVl8q_DSfeo";

    const headers = {
      "Cookie": cookie,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
        "http://food.myftp.biz/search-address",
        {
          text,
        },
        {
          headers,
        },
    );

    // Extract only the 'description' field from the response data
    const descriptions = response.data.data
        .map((item) =>
          item.predictions.map((prediction) => prediction.description),
        )
        .flat();

    return res.json({
      descriptions,
    });
  } catch (error) {
    console.error("Error in search-address route:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
});

router.get("/search-test", async (req, res) => {
  try {
    const {query} = req.query; // Lấy query từ body request

    // Gọi đến API của DealToday
    const response = await axios.get(
        `https://www.dealtoday.vn/solrVoucherSuggest`,
        {
          params: {
            cityId: 0,
            top: 10,
            query: query,
          },
          headers: {
            Accept: "application/json",
          },
        },
    );

    // Xử lý dữ liệu từ phản hồi
    const suggestions = response.data.suggestions.map((item) => ({
      value: item.value,
      avatar: item.data.avatar,
      category: item.data.category,
      url: item.data.url,
    }));

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
});

function generateRandomHash() {
  const randomData = crypto.randomBytes(64);
  const hash = crypto.createHash("sha256");
  hash.update(randomData);
  return hash.digest("hex");
}

async function loadData() {
  try {
    const randomNumber = Math.floor(Math.random() * (6 - 3 + 1) + 3);
    const randomColumn = `cot${randomNumber}`;
    const url = `https://script.googleusercontent.com/macros/echo?user_content_key=LuHSBdiNve-5pjuHgvBORtEdkhirAgibkswbAZoWPMZCXvsX4zYAfBEvYgeQa1zwqUC0ikc2w3K9Czk2dCSeICOt7RjFSU0SOJmA1Yb3SEsKFZqtv3DaNYcMrmhZHmUMWojr9NvTBuBLhyHCd5hHa4MZhzyoDMkbak4gULKrZi2bnh6sQfD4XBz03ERvGucuoc-jqt3YshS5CSC-UOsHgMui4HKNfY9jPltgekj2bJCveNi9jPPQ-jJwPvApp-fJsKABdS07WRQ&lib=M6PBTW-JMFzem_yt-1Gsu1dJoCwTMzo-q`;
    const response = await axios.get(url, {
      timeout: 30000,
    });
    if (response.status === 200) {
      const extractedValue = response.data.data[0][0];
      console.log("Load data thành công", extractedValue);
      const cookiesRef = db.collection("cookieCheckSim").doc("1");
      await cookiesRef.set({
        cookie: extractedValue,
      });
    } else {
      console.log("Failed to retrieve data from the API");
    }
  } catch (error) {
    console.error("Lỗi sever or mạng lag bật lại tool.", error.message);
  }
}

async function checkForgotPass(phone) {
  // loadAndSaveData()
  const headers = {
    "authority": "shopee.vn",
    "accept": "application/json",
    "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
    "content-type": "application/json",
    "origin": "https://shopee.vn",
    "sec-ch-ua":
      "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
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
    const response = await axios.post(
        "https://shopee.vn/api/v4/account/login_by_password",
        jsonData,
        {
          headers,
        },
    );
    return {
      response: response.data,
    };
  } catch (error) {
    console.error("Error:", error.message);
    return error.message;
  }
}

router.post("/checkForgotPass", async (req, res) => {
  const {phone} = req.body;

  try {
    const forgotData = await checkForgotPass(phone);
    res.status(200).json(forgotData);
  } catch (error) {
    console.error("Error in checkForgotPass route:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

async function checkPhoneExist(phone) {
  try {
    const forgotData = await checkForgotPass(phone);
    const error = forgotData.response.error;
    console.log("forgotData: ", error);
    if (error === 9) {
      return {
        result: "fasle",
        error_msg: "Tài khoản bị khoá",
      };
    }

    if (error === 2 || error === 89) {
      if (error === 89) {
        loadData();
        return {
          result: "fasle",
          error_msg: "Lỗi 89",
        };
      }
      const cookiesRef = db.collection("cookieCheckSim").doc("1");
      const doc = await cookiesRef.get();
      const data = doc.data();
      const cookie1 = data.cookie;
      const cookieHeaders = {
        "authority": "banhang.shopee.vn",
        "accept": "application/json, text/plain, */*",
        "accept-language": "vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6",
        "content-type": "application/json;charset=UTF-8",
        "cookie": cookie1,
        "origin": "https://banhang.shopee.vn",
        "referer":
          "https://banhang.shopee.vn/portal/vn-onboarding/form/291000/291100",
        "sc-fe-ver": "21.44522",
        "sec-ch-ua":
          "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
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

      const phoneExistData = await axios.post(
          "https://banhang.shopee.vn/api/onboarding/local_onboard/v1/vn_onboard/phone/check/",
          json_data,
          {
            headers: cookieHeaders,
          },
      );
      console.log("forgotData2: ", phoneExistData.data);

      if (forgotData.response.error_msg === "token not found") {
        loadData();
        return {
          result: "fasle",
          error_msg: "Data Update",
        };
      }
      if (forgotData.response.user_msg) {
        return {
          result: "fasle",
          error_msg: "Tài khoản tồn tại",
        };
      }
      if (phoneExistData.data === "OK") {
        return {
          result: "true",
          error_msg: "Tài khoản chưa tồn tại",
        };
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    loadData();
    return {
      result: "fasle",
      error_msg: "Update Data",
    };
  }
}

router.post("/check-phone2", async (req, res) => {
  const {phone} = req.body;
  try {
    const addressData = await checkPhoneExist(phone);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// CheckPhoneV2: Verify if a phone has a Shopee account using mall.shopee.vn API
// router.get("/check-phone-shopee", async (req, res) => {
//   try {
//     const { phone } = req.query;
//     if (!phone) {
//       return res.status(400).json({ error: "Missing 'phone' in body" });
//     }

//     // Normalize to 84xxxxxxxxx format
//     const raw = String(phone).trim().replace(/^\+/, "");
//     let formattedPhone = raw;
//     if (raw.startsWith("84")) {
//       formattedPhone = raw;
//     } else if (raw.startsWith("0")) {
//       formattedPhone = `84${raw.slice(1)}`;
//     } else if (/^\d+$/.test(raw)) {
//       // If it is digits and not starting with 84, assume missing country code
//       formattedPhone = raw.length <= 11 ? `84${raw}` : raw;
//     }

//     const csrfToken = (function (
//       length,
//       characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
//     ) {
//       let randomString = "";
//       for (let index = 0; index < length; index++) {
//         let randomIndex = Math.floor(Math.random() * characters.length);
//         randomString += characters[randomIndex];
//       }
//       return randomString;
//     })(32);
//     const headers = {
//       "User-Agent": "Android app Shopee appver=28320 app_type=1",
//       "Content-Type": "application/json",
//       "x-csrftoken": csrfToken,
//       referer: "https://mall.shopee.vn/",
//       Cookie: `csrftoken=${csrfToken};`,
//     };

//     const payload = {
//       phone: formattedPhone,
//       scenario: 3,
//     };

//     const response = await axios.post(
//       "https://mall.shopee.vn/api/v4/account/basic/check_account_exist",
//       payload,
//       { headers }
//     );

//     const data = response && response.data && response.data.data ? response.data.data : null;
//     if (!data || typeof data.exist !== "boolean") {
//       return res.status(502).json({ error: "Unexpected response from Shopee" });
//     }

//     if (data.exist) {
//       const username = data.user && data.user.username ? data.user.username : "";
//       return res.json({
//         resolve: false,
//         username,
//       });
//     }

//     return res.json({
//       resolve: true,
//       username: "",
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message || "Internal error" });
//   }
// });

async function check(sdt, cookie) {
  return new Promise(async (resolve, reject) => {
    try {
      const headers = {
        "authority": "shopee.vn",
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        "af-ac-enc-sz-token":
          "ZSeGDrjmvJEuyydH3iL3lw==|H2HMOX4zpU1qxE2I7CysULWQElSowePw3ZSNsTb0OxH9GfsTzZBxgI4DWI5a3Ab0vOZWLshsnrQ=|PH9upc2Ee9IzA+ZM|08|3",
        "content-type": "application/json",
        "cookie": cookie,
        "origin": "https://shopee.vn",
        "referer": "https://shopee.vn/user/account/phone",
        "sec-ch-ua":
          "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "x-api-source": "pc",
        "x-csrftoken": "JHDzSP5oq4auTeqWxt2IT6iPl57Eekcr",
        "x-requested-with": "XMLHttpRequest",
        "x-sap-ri": "61048f65f9d94bb1e059d7380301bf0ad77a0a5906f49a4c08c3",
        "x-sap-sec":
          "am0/ZzbimRVgyRVgzzVGyRbgzzVgyRbgyRVmyRVgLRAgyB6jyR1myzVgzRVgy+/EhnNGyRVgbRAgyd6jyRUpCaYX8rzxaj+mmJTmJdjiy6FHRvhegYQNUN+izFp2kE6vxI1q5mCWeo/p4kTqxI7T/yLYSgzszbmgcxP6daxSEszGMbx0aXbOJH2oLouZ1jlXABwJMaQOSxNdUZ664vYJjck8BIXBjACwGItOv5H7GPxcavUm1E9R6v21AOv+N+D3SGh7pCrhWDLXkowEazUAqPE3UYlFMoEXf7QdIfWdI5Wrexhql3K5mkVRTWCPdebCHJlX/HeGzgyj7VCS/hGjPyQLD607IXZNZuCtaHM221Ab2sO8A9prfunWsaC1cFg/uk0nheCn3iMJ6zO6RZ8upwJ/tybFAG1XyK1MC465nr2SZ9VAH5bz8v/++45KGV/llEzdpGbqrUjVDkpK3btYe6Ymt+DqxUUq1OsWkv+ZBM9SFfe8GUkownIOXuwM/bwrmNWe8m10geqwS7PO9IfJWl1LjXbSrjKRKAR9FhrAu6HSstJMqgH0jFTy0sN8ub4KPL+MzsmORdOfQ2lq8PGarqokwRI0tl8pCaeZXXU6eStNGqrDUDGC+Vrxei8X45Uk1JpmcsYZJ/j2PHTYJU+pSwW3sjxX6DMYRiGeLNEsul5pgfKJ2XhqMauZMUJJ4vY4X/7fXJoMHzWr63ckC/MEBHJXn8Dsi5WMCQ9EVp+SGUetUv6Keqeh9IDx+dPJocLzHFeePzQjwp5T6G2+vEv7cv8Z0nA45Yqww6AGyRVgYlpOYMuhYMAgyRVgBKBShAHgyRVUyRVgjRVgydNqBRw3e1YnJfi7WiSoucZ7XsbwlRVgyMqBYIqBYlj4yRVgy2/ShnNGyRVggRVgydbgyR1gJ90tfxNfn0Ouiu/qBSbZARc08zjgyR1N1DpkCQTcyK==",
        "x-shopee-language": "vi",
        "x-sz-sdk-version": "3.4.0-2&1.6.12",
      };

      const json_data = {
        phone: `84${sdt}`,
        device_sz_fingerprint:
          "ExcBAAAABAAAAIAAAAa+TsIelQA9VyGRniTZab9ZDlI0p7BdFo0vx1iRi9ehCPCJxma6kE6/y9dL9kx3JuZ93iTOaG+9jjcFSRjh70Zn3JQd4wNf/qT6gMNmGHa1EJ6Xcumk3VvbHkHhi03NIq95yOE1YKEu6iZ0PDncGjYZaMtSUFeCn4WvA/PwqJ/awStBUaKDUiS2SAAAAAYAAAAAAAAAAAYwUrU0RQWRf8VR07DAVRn/5SoK3UhGRSPu+VXOm0scA078Q0hzUNwfzmDFSf8BmRxh0PSGDd16ZYkSJd5Ab6w7dQrZdNjtGgZrGxo5GGkiuqnYldp0dkstAhMdOPuWbAe3gUI4utp7SMZxBtsEnad016k8nhRdfWFB3F9DgAh41DX7hE0WuiTnS40rYB+sFpedfjuQ9KWy87XQMkTBcHbz1o69Au7kZ5C2Ofca6Kb6PeBZNgWXwW2ZHH9Yo3BrSgn1i4x0UMEBNbv0gpwMFjkKEWHSuLJeYvE0zA8OnvbWNw1BfnbFp18mZqc9xCIgvyYt3al9zx1KBGI9BgeMMu5jHFSdyZiuwHcgQghO88g54C1cPH4F16dbC2grkq7Uafrxu1zfDTeRYIqyBHHUsLV2XiQqi27/BBN2E6HKXatPx/iM6pgsa1mROgQeVpkER4kGzaQa0k4n/0mjG7+n9Ab2hDQN/HcnoyXkuikyDcwP0w1U4hbrlCxrgldFOlYt0Rlg1cx3XbG1q8tqGbeOtpBgbWqmMlm1XCONx12lF7nLFqTleiVWc2LyahObCPMZ/Yfr7/BJi5FjSsrgawJCtyVSaac6W2Wrz7z4wIW2T/KMHt3+QlWMssTgE7jrDdlzkUnmYFzqYfXL3rqxkj4MHkz/nVTTDo+bCoXKXgnHbv7sJeAU9J7OJZNfLXh6LPxhWZUezLwUr85jKTSnHVFkZoGapRV8vl8R9yHmaLc9+VWA+pbCMkfaXUhWRR5PyfKCzuWq4HU/6wt7OMDlxDkPxVp5MN3E+a0qIlGrsUR+HQH0/hjpBgdgLYR8N+8yNxO31g9ZGz8cQTlhapudFK/k5Dbg9pdR/Olul0Z0PYHXg0mTEXBE9lDyBoPZSv3/VZuxdbKnERtga8N1yWA78q1420FFbbXPDaH8AhvxjqxVHhyy+ov23Cp269DOCSWKhbH4b3hEFmNIIUcme2WixC4gRjlQb+LdU/9GXjXaZgAY5c4qNbIDogRM+1CGzJNaItaS5wNjungn1dAKzyZcybMVyhxYH2hgdKd8ESX4D8tCV4ux+PP2CMtfjgq2iOcipJQri+1wAO4tKzyTj8nBSzsXrd75ShJYlb8P0XbHOE4QC6bNqeV89w2PIY8haFMmpYMcekCk1W1XURAHJRpfA54Ca7FkQq/rzksS5BgmFCEMwqtKN5nHZ0BRUAAGpoNO9LLmd6WvJ1vLOaWAWhAg+48kYH+QQGX7vBtEszZk3waHCHpk4CvdjfIR/pDU2+9e9O/FSmdjVDPbHXVcVyYQ7xZgkw9QCBaaJLGElbqGTqXef0kWWo8H43dyPLBBArKwbgKSP2XZXfcgMtGzGWHwiT11cMXvvaXq+yLAyiZFqVzrhX1YciMoUalMZq6UpV+K2DvYt5tqYXXPOglPP+lus7pyBosqe+Xpqr7035pGZiJjH5iCSEi0WqS4Hkh1083x50rY+xKjj/yHp4Sjpqk48+1TMLNc33QxOb8raNGEnvAnZ3NoUuEW2WfSEXK5ER2aDjDjhrq9idiOZ6h3bMoZYa7msB8OVYjsqZ+N6GJ33N/WIxe/d9y1E1kVNo2BLFX1kosJvOWARXxQI1QpIG6LjWWHyrFLEenVgd02VUEvgp8mxYYoTdg+n4QkdcbITNcnxxqXpQojxCzL5cezGWyJ8fLrCrxKtpRYmemIc5B+zJdiZsUk5ZFWgxyRP87+sCR4WLljWAKFGxawZVGtpRyQvCOdCATxtT++xdbpmHOFBYjb+C6dywp2+DHuqh8BBHPPoq1b/q4EfnFyYMQ5Vv5kgafm6GDNfmsgZjHzSTZVcwrJDT/0A/PCv93fDhuiH8mAvmPd7KbRxuQaQcFGVEHcJGKHSDZJmmrGdnVNBzg4cb2qKDDzhuLQmVZLdhvOC8N5ik9MmYARtu0+XmnNHYLr1A0FITgHh7PRYb3wiEETt5WQK0amLRtzzTP4ejWVusCCdM3RI63/PsJQWso6F2kvFMuNBJwBzc2KwgMKsCndG9oZFyYZcxY5SLrDGKfz3iFiqOEuOEi8awLqbRH4+1CqtQTmjMTSCslZMJwa665wzl6nj6+pzyOeusbVV73j21GgSVs7Cknd||MTAwMDA=",
      };

      const response = await axios.post(
          "https://shopee.vn/api/v4/account/management/check_unbind_phone",
          json_data,
          {headers},
      );

      const data = response.data;
      const error_code = data.error;

      if (error_code === 10013) {
        resolve({
          resolve: true,
          error_code,
        });
      } else {
        resolve({
          resolve: false,
          error_code,
        });
      }
    } catch (error) {
      resolve({
        resolve: false,
        error_code: "Cookie Die",
      });
    }
  });
}
// Function to delete a cookie from the database
async function deleteCookie(cookieId) {
  try {
    await db.collection("cookies").doc(cookieId).delete();
    console.log(`Cookie with ID ${cookieId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting cookie with ID ${cookieId}:`, error);
  }
}

// Route to check phone and handle cookies
// router.get("/check-phone-shopee", async (req, res) => {
//   const { phone } = req.query;

//   try {
//     const cookieData = await getRandomCookie();
//     if (!cookieData) {
//       return res.status(404).json({ error: "No cookies found" });
//     }

//     const result = await check(phone, cookieData.SPC_ST);

//     if (result.resolve === false && result.error_code === "Cookie Die") {
//       await deleteCookie(cookieData.id); // Delete the invalid cookie
//     }

//     res.json(result);
//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// });

// router.post("/check-phone-shopee-cookie", async (req, res) => {
//   const { phone, cookie } = req.body;

//   try {
//     const cookieData = cookie;
//     if (!cookieData) {
//       return res.status(404).json({ error: "No cookies found" });
//     }

//     const result = await check(phone, cookieData);

//     if (result.resolve === false && result.error_code === "Cookie Die") {
//       await deleteCookie(cookieData.id); // Delete the invalid cookie
//     }

//     res.json(result);
//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// });

// // Function to get a random cookie
// async function getRandomCookie() {
//   try {
//     const snapshot = await db
//       .collection("cookies")
//       .orderBy("time")
//       .limit(1)
//       .get();

//     if (snapshot.empty) {
//       return null;
//     }

//     const doc = snapshot.docs[0];
//     const cookieData = doc.data();

//     return {
//       id: doc.id,
//       SPC_ST: cookieData.SPC_ST,
//       time: cookieData.time,
//     };
//   } catch (error) {
//     console.error("Error getting random cookie:", error);
//     return null;
//   }
// }

// router.post("/check-phone", async (req, res) => {
//   const { phone } = req.body;
//   try {
//     const addressData = await checkPhoneExist(phone);
//     res.json(addressData);
//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// });

// const getCookie = await getRandomCookie();
// const cookie = getCookie.SPC_ST;
// console.log("cookie: ", cookie);
// try {
//     const {
//         phone
//     } = req.body;
//     const result = await check(phone, cookie);
//     if (result === "DeadCookie") {
//         try {
//             const docRef = db.collection("cookies").doc(getCookie.id);
//             const doc = await docRef.get();
//             if (!doc.exists) {
//                 console.error(`Cookie with ID ${getCookie.id} does not exist`);
//                 return false;
//             }
//             await docRef.delete();
//             const result2 = await check(phone, cookie);
//             console.log("result: ", result2);
//             res.json({
//                 result2,
//             });
//         } catch (error) {
//             console.error("Error deleting cookie:", error);
//             return false;
//         }
//     } else {
//         console.log("result: ", result);
//         res.json({
//             result,
//         });
//     }
// } catch (error) {
//     console.error(`Error occurred while checking phone:`, error);
//     res.status(500).json({
//         error: "Internal server error",
//     });
// }

router.delete("/delete-old-cookies", async (req, res) => {
  try {
    const cookiesRef = db.collection("cookies");

    // Get all cookies
    const snapshot = await cookiesRef.orderBy("time", "desc").get();
    const cookies = [];

    // Iterate over each cookie
    snapshot.forEach((doc) => {
      cookies.push({
        id: doc.id,
        data: doc.data(),
      });
    });

    // If the number of cookies is greater than or equal to 1000, delete old cookies
    if (cookies.length >= 400) {
      const cookiesToDelete = cookies.slice(400); // Get the oldest cookies

      // Delete each old cookie
      const deletionPromises = cookiesToDelete.map(async (cookie) => {
        await cookiesRef.doc(cookie.id).delete();
      });

      await Promise.all(deletionPromises); // Wait for all delete promises to complete
      console.log(`Deleted ${cookiesToDelete.length} old cookies.`);
      res.status(200).json({
        message: `Deleted ${cookiesToDelete.length} old cookies.`,
      });
    } else {
      console.log("No old cookies to delete.");
      res.status(200).json({
        message: "No old cookies to delete.",
      });
    }
  } catch (error) {
    console.error("Error deleting old cookies:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

function encodedKey(resi) {
  const key = "0ebfffe63d2a481cf57fe7d5ebdc9fd6";
  const encodedKey = Buffer.from(key).toString("base64");
  const time = Math.floor(Date.now() / 1000);
  const parameter = `${resi}|${time}${crypto
      .createHash("sha256")
      .update(resi + time + encodedKey)
      .digest("hex")}`;
  return parameter;
}

async function SPXTracking(waybill) {
  try {
    const waybillUpperCase = waybill.toUpperCase();
    const encoded = encodedKey(waybillUpperCase);
    const response = await axios.get(
        `https://spx.vn/api/v2/fleet_order/tracking/search?sls_tracking_number=${encoded}`,
        {
          headers: {
            "Authority": "spx.vn",
            "Sec-Ch-Ua":
            "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"91\", \"Chromium\";v=\"91\"",
            "Accept": "application/json, text/plain, */*",
            "Sec-Ch-Ua-Mobile": "?0",
            "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Referer": `https://spx.vn/detail/${waybillUpperCase}`,
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cookie":
            "_ga=GA1.3.1846728554.1660367856; _gid=GA1.3.864556559.1660367856; fms_language=id; _gat_UA-61904553-17=1",
          },
        },
    );
    const firstTrackingItem = response.data.data.tracking_list[0];

    const timestamp = firstTrackingItem.timestamp * 1000;
    const timeString = new Date(timestamp).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const dateString = new Date(timestamp).toLocaleDateString("en-US");

    // Trả về dữ liệu mong muốn
    return {
      time: timeString,
      date: dateString,
      message: firstTrackingItem.message,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

async function JNTTracking(trackingID, cellphone) {
  try {
    if (!trackingID || !cellphone) {
      throw new Error("Missing parameters: 'trackingID', or 'cellphone'.");
    }

    // Make request to JNTTracking page
    const response = await axios.get(
        `https://jtexpress.vn/vi/tracking?type=track&billcode=${trackingID}&cellphone=${cellphone}`,
    );
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract tab-content data
    const tabContent = $(".tab-content");
    const result = [];

    // Iterate over each item in tab-content
    tabContent.find(".result-vandon-item").each((index, element) => {
      const time = $(element).find(".SFProDisplayBold").first().text().trim();
      const message = $(element).find("div").last().text().trim();
      const date = $(element).find(".SFProDisplayBold").last().text().trim();

      result.push({
        time,
        message,
        date,
      });
    });

    return result[0];
  } catch (error) {
    console.error("Error fetching JNTTracking data:", error);
    throw new Error("Internal server error");
  }
}

async function GHNTracking(orderCode) {
  try {
    if (!orderCode) {
      throw new Error("Missing 'order_code'.");
    }

    const response = await axios.post(
        "https://fe-online-gateway.ghn.vn/order-tracking/public-api/client/tracking-logs",
        {
          order_code: orderCode,
        },
    );

    const trackingLog =
      response.data.data.tracking_logs[
          response.data.data.tracking_logs.length - 1
      ];

    const time = trackingLog.action_at.split("T")[0];
    const message = trackingLog.location.address;

    return {
      time,
      date: trackingLog.action_at.split("T")[1],
      message,
    };
  } catch (error) {
    console.error("Error tracking order:", error.message);
    throw new Error("Internal server error");
  }
}

async function NJVTracking(tracking_id) {
  try {
    if (!tracking_id) {
      throw new Error("Missing 'tracking_id'.");
    }
    const response = await axios.get(
        `https://walrus.ninjavan.co/vn/dash/1.2/public/orders?tracking_id=${tracking_id}`,
    );

    // Check if events array is empty
    if (!response.data.events || response.data.events.length === 0) {
      return {
        error: "No tracking events available for the provided tracking ID.",
      };
    }

    const eventData = response.data.events[0];

    // Lấy các thông tin cần thiết
    const time = eventData.time.split("T")[1].slice(0, -1); // Lấy giờ từ thời gian
    const message = `${eventData.type} ${eventData.data.hub_name}`; // Tạo message từ type và hub_name
    const date = eventData.time.split("T")[0]; // Lấy ngày từ thời gian

    return {
      time,
      message,
      date,
    };
  } catch (error) {
    console.error("Error tracking order:", error.message);
    throw new Error("Internal server error");
  }
}

router.post("/tracking", async (req, res) => {
  try {
    const {webtracking, trackingID, cellphone} = req.body;

    if (!webtracking || !trackingID) {
      return res.status(400).json({
        error:
          "Missing 'webtracking' or 'trackingID' field in the request body.",
      });
    }

    let trackingResult;
    if (webtracking.toUpperCase() === "SPX") {
      trackingResult = await SPXTracking(trackingID);
    }
    if (webtracking.toUpperCase() === "JNT") {
      trackingResult = await JNTTracking(trackingID, cellphone);
    }
    if (webtracking.toUpperCase() === "GHN") {
      trackingResult = await GHNTracking(trackingID);
    }
    if (webtracking.toUpperCase() === "NJV") {
      trackingResult = await NJVTracking(trackingID);
    }
    // else {
    //     return res.status(400).json({
    //         error: "Unsupported webtracking type."
    //     });
    // }
    res.json({
      trackingResult,
    });
  } catch (error) {
    console.error("Error occurred while tracking:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/trackingList", async (req, res) => {
  try {
    const {trackingList} = req.body;

    if (!trackingList || !Array.isArray(trackingList)) {
      return res.status(400).json({
        error:
          "Invalid tracking list. It should be an array of tracking objects.",
      });
    }

    const trackingResults = [];

    for (const item of trackingList) {
      const {trackingID, cellphone} = item;

      if (!trackingID) {
        trackingResults.push({
          error: "Missing 'trackingID' field in the tracking object.",
        });
        continue;
      }

      let trackingResult;

      switch (true) {
        case trackingID.startsWith("SPX") || trackingID.startsWith("VN"):
          trackingResult = await SPXTracking(trackingID);
          break;
        case cellphone && cellphone.length > 1:
          trackingResult = await JNTTracking(trackingID, cellphone);
          break;
        case trackingID.startsWith("G"):
          trackingResult = await GHNTracking(trackingID);
          break;
        case trackingID.startsWith("NJV") || trackingID.startsWith("SPE"):
          trackingResult = await NJVTracking(trackingID);
          break;
        default:
          trackingResult = {
            error: "Unsupported webtracking type.",
          };
      }

      trackingResults.push({
        trackingID,
        result: trackingResult,
      });
    }

    res.json({
      trackingResults,
    });
  } catch (error) {
    console.error("Error occurred while tracking:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

async function getNotifications(cookie) {
  const url = "https://shopee.vn/api/v4/notification/get_notifications";
  const headers = {
    "accept": "application/json",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "cache-control": "max-age=0",
    "cookie": cookie,
    "priority": "u=0, i",
    "sec-ch-ua": "\"Chromium\";v=\"123\", \"Not:A-Brand\";v=\"8\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "cross-site",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.58 Safari/537.36",
  };
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });
    const data = await response.json();
    if (data.error !== 19) {
      console.log("data: ", data);
      const actions = data.data.actions;
      const groupIds = actions
          .filter((action) => action.groupid && action.groupid !== "0")
          .map((action) => action.groupid.slice(3));
      console.log(groupIds);
      return {
        groupIds,
      };
    } else {
      console.error(`HTTP Error: ${response.status}`);
      console.log("data: ", data);
      return {
        error: "DeadCookie",
      };
    }
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
    return [];
  }
}

router.get("/notifications", async (req, res) => {
  try {
    const cookie = req.body.cookie;
    const data = await getNotifications(cookie);
    res.json({
      data,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi lấy thông báo:", error);
    res.status(500).json({
      error: "Đã xảy ra lỗi khi lấy thông báo",
    });
  }
});

async function fetchOrderDetail(order_id, cookie) {
  const url = `https://mall.shopee.vn/api/v4/order/get_order_detail?order_id=${order_id}`;
  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };
  try {
    const response = await axios.get(url, {
      headers,
    });

    const data = response.data?.data;

    if (!data) {
      console.error(`Không có dữ liệu trả về cho order_id ${order_id}`);
      return {
        order_id,
        tracking_number: "Không xác định",
        tracking_info_description: "Không xác định",
        address: {
          shipping_name: "Không xác định",
          shipping_phone: "Không xác định",
          shipping_address: "Không xác định",
        },
        product_info: [],
      };
    }

    // Kiểm tra trạng thái đơn hàng
    const isCancelled =
      data.status?.status_label?.text === "label_order_cancelled";

    const address = {
      shipping_name: data.address?.shipping_name || "Không xác định",
      shipping_phone: data.address?.shipping_phone || "Không xác định",
      shipping_address: data.address?.shipping_address || "Không xác định",
    };

    return {
      order_id,
      tracking_number: data.shipping?.tracking_number || "Không xác định",
      tracking_info_description: isCancelled ?
        "Đã hủy" :
        data.shipping?.tracking_info?.description || "Không xác định",
      address,
      product_info:
        data.info_card?.parcel_cards?.[0]?.product_info?.item_groups?.[0]
            ?.items || [],
    };
  } catch (error) {
    console.error(
        `Đã xảy ra lỗi khi lấy thông tin đơn hàng ${order_id}:`,
        error,
    );
    return {
      order_id,
      tracking_number: "Không xác định",
      tracking_info_description: "Lỗi khi lấy dữ liệu",
      address: {
        shipping_name: "Không xác định",
        shipping_phone: "Không xác định",
        shipping_address: "Không xác định",
      },
      product_info: [],
    };
  }
}

router.post("/getOrderDetails", async (req, res) => {
  try {
    const {order_ids, cookie} = req.body;
    if (!order_ids || !cookie) {
      return res.status(400).json({
        error: "Thiếu order_ids hoặc cookie",
      });
    }
    const orderDetails = await Promise.all(
        order_ids.map((order_id) => fetchOrderDetail(order_id, cookie)),
    );
    return res.json({
      orderDetails,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error);
    res.status(500).json({
      error: "Đã xảy ra lỗi khi lấy thông tin đơn hàng",
    });
  }
});

router.post("/getOrderDetailsForCookie", async (req, res) => {
  try {
    const {cookies} = req.body;
    if (!cookies || cookies.length === 0) {
      return res.status(400).json({
        error: "At least one cookie is required",
      });
    }
    const allOrderDetails = [];
    for (const cookie of cookies) {
      try {
        const data = await getNotifications(cookie);
        const orderIds = data.groupIds;
        console.log("orderIds: ", orderIds);
        if (orderIds && orderIds.length > 0) {
          const orderDetails = await Promise.all(
              orderIds.map((order_id) => fetchOrderDetail(order_id, cookie)),
          );
          allOrderDetails.push({
            cookie,
            orderDetails,
          });

          await db.collection("cookies").add({
            SPC_ST: cookie,
            time: new Date().getTime(),
          });
        } else {
          allOrderDetails.push({
            cookie,
            orderDetails: [
              {
                order_id: "",
                tracking_number: "Đang chờ",
                tracking_info_description: "Đang chờ",
                address: {
                  shipping_name: "Đang chờ",
                  shipping_phone: "Đang chờ",
                  shipping_address: "Đang chờ",
                },
                product_info: [
                  {
                    item_id: "",
                    model_id: "",
                    shop_id: "",
                    name: "",
                    model_name: "",
                  },
                ],
              },
            ],
          });
        }
      } catch (error) {
        console.error(`Error processing cookie ${cookie}:`, error);
        allOrderDetails.push({
          cookie,
          error: "Internal Server Error",
        });
      }
    }

    // Trả về kết quả cho mỗi cookie
    res.json({
      allOrderDetails,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/getAllCookies", async (req, res) => {
  try {
    // Lấy tất cả các cookie từ Firestore
    const snapshot = await db.collection("cookies").get();

    // Mảng để lưu trữ các cookie
    const allCookies = [];

    snapshot.forEach((doc) => {
      // Lấy dữ liệu của mỗi document (cookie)
      const cookieData = doc.data();
      allCookies.push({
        id: doc.id,
        SPC_ST: cookieData.SPC_ST,
        time: cookieData.time,
      });
    });

    res.json({
      allCookies,
    });
  } catch (error) {
    console.error("Error getting all cookies:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/generate-qr-code", async (req, res) => {
  try {
    // Make a request to the Shopee API endpoint to generate QR code
    const response = await axios.get(
        "https://shopee.vn/api/v2/authentication/gen_qrcode",
    );

    // Check if the response status is 200 (OK) and contains data
    if (response.status === 200 && response.data && response.data.data) {
      const data = response.data.data;
      res.json({
        data,
      });
    } else {
      // Handle unexpected response
      res.status(500).json({
        error: "Failed to generate QR code",
      });
    }
  } catch (error) {
    // Handle errors during request or QR code generation
    console.error("Error generating QR code:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/check-qr-status", async (req, res) => {
  try {
    // Get the QR code ID from the query parameters
    const qrcodeId = req.query.qrcode_id;

    // Make a request to the Shopee API endpoint to check QR code status
    const response = await axios.get(
        `https://shopee.vn/api/v2/authentication/qrcode_status?qrcode_id=${encodeURIComponent(
            qrcodeId,
        )}`,
    );

    // Check if the response status is 200 (OK) and contains data
    if (response.status === 200 && response.data) {
      const data = response.data;
      // Send the data from Shopee API response as JSON
      res.json(data);
    } else {
      // Handle unexpected response
      res.status(500).json({
        error: "Failed to check QR code status",
      });
    }
  } catch (error) {
    // Handle errors during the request
    console.error("Error checking QR code status:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/login-qr", async (req, res) => {
  try {
    const {qrcodeToken} = req.body;
    const postData = {
      qrcode_token: qrcodeToken,
      device_sz_fingerprint:
        "OazXiPqlUgm158nr1h09yA==|0/eMoV7m/rlUHbgxsRgRC/n0vyOe6XzhDMa2PcnZPv3ecioRaJQg2W7ur5GfhoDDEeuMz2az7GGj/8Y=|Pu2hbrwoH+45rDNC|08|3",
      client_identifier: {
        security_device_fingerprint:
          "OazXiPqlUgm158nr1h09yA==|0/eMoV7m/rlUHbgxsRgRC/n0vyOe6XzhDMa2PcnZPv3ecioRaJQg2W7ur5GfhoDDEeuMz2az7GGj/8Y=|Pu2hbrwoH+45rDNC|08|3",
      },
    };

    // Gửi yêu cầu POST tới API đăng nhập qua QR code của Shopee
    const loginResponse = await axios.post(
        "https://shopee.vn/api/v2/authentication/qrcode_login",
        postData,
    );

    // Kiểm tra xem phản hồi có chứa cookie không
    if (loginResponse.headers["set-cookie"]) {
      const cookies = loginResponse.headers["set-cookie"];
      const spcStCookie = cookies.find((cookie) => cookie.includes("SPC_ST"));
      if (spcStCookie) {
        // Trả về cookie cho client
        res.status(200).json({
          cookie: spcStCookie.split(";")[0],
          // cookieFull: loginResponse.headers["set-cookie"],
        });
      } else {
        // Nếu không tìm thấy cookie SPC_ST, trả về lỗi
        res.status(404).json({
          error: "Cookie SPC_ST không tìm thấy.",
        });
      }
    } else {
      // Nếu không có cookie nào trong phản hồi, trả về lỗi
      res.status(404).json({
        error: "Không tìm thấy cookie trong phản hồi.",
      });
    }
  } catch (error) {
    // Xử lý lỗi khi thực hiện yêu cầu đăng nhập qua QR code
    console.error("Lỗi khi đăng nhập qua QR code:", error.message);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
    });
  }
});

async function addToCart(quantity, shopid, itemid, modelid, cookie) {
  const url = "https://mall.shopee.vn/api/v4/cart/add_to_cart";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  const payload = {
    quantity,
    shopid,
    itemid,
    modelid,
  };
  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error.message);
    throw error;
  }
}

router.post("/add-to-cart", async (req, res) => {
  try {
    const {quantity, shopid, itemid, modelid, cookie} = req.body;
    const data = await addToCart(quantity, shopid, itemid, modelid, cookie);
    res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error.message);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
    });
  }
});

async function creatAddress(
    name,
    phone,
    state,
    city,
    district,
    address,
    longitude,
    latitude,
    cookie,
) {
  const url =
    "https://mall.shopee.vn/api/v4/account/address/create_user_address";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  const payload = {
    address: {
      name,
      phone,
      country: "VN",
      state,
      city,
      district,
      town: "",
      zipcode: "",
      address_instruction: "",
      address,
      label_id: 2,
      geoinfo: {
        region: {
          longitude,
          latitude,
        },
        user_verified: true,
        user_adjusted: false,
        geoinfo_confirm: true,
      },
    },
    address_flag: {
      as_default: true,
    },
  };
  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi thêm địa chỉ:", error.message);
    throw error;
  }
}

router.post("/addAddress", async (req, res) => {
  const {
    name,
    phone,
    state,
    city,
    district,
    address,
    longitude,
    latitude,
    cookie,
  } = req.body;

  try {
    const result = await creatAddress(
        name,
        phone,
        state,
        city,
        district,
        address,
        longitude,
        latitude,
        cookie,
    );
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error adding address:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

async function getAddress(cookie) {
  const url =
    "https://mall.shopee.vn/api/v4/account/address/get_user_address_list";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  try {
    const response = await axios.get(url, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ:", error.message);
    throw error;
  }
}

router.post("/getAddress", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await getAddress(cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getOrderList(cookie) {
  const url =
    "https://mall.shopee.vn/api/v4/order/get_order_list?call_recommendation_orders_count_threshold=3&limit=10&list_type=3&offset=0&recommendation_limit=6&view_session_id=f8g3b30QKGBOH4kDmuxnKUiPcSis19rxaECQjN0O48I%3D-1714142228911";

  const headers = {
    "Cookie": cookie,
    "Referer": "https://shopee.vn/user/purchase/?type=3",
    "Sec-Ch-Ua":
      "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"Windows\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "X-Api-Source": "pc",
    "X-Csrftoken": "5rkFyxI5wVfLvIIl7plbkemfJQChn86n",
    "X-Requested-With": "XMLHttpRequest",
    "X-Shopee-Language": "vi",
    "X-Sz-Sdk-Version": "unknown",
  };

  try {
    const response = await axios.get(url, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách order:", error.message);
    throw error;
  }
}

router.post("/getOrderList", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await getOrderList(cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getCheckoutList(cookie) {
  const url =
    "https://mall.shopee.vn/api/v4/order/get_checkout_list?cursor=0&limit=10";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Referer": "https://shopee.vn/user/purchase/?type=3",
    "Sec-Ch-Ua":
      "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"Windows\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "X-Api-Source": "pc",
    "X-Csrftoken": "5rkFyxI5wVfLvIIl7plbkemfJQChn86n",
    "X-Requested-With": "XMLHttpRequest",
    "X-Shopee-Language": "vi",
    "X-Sz-Sdk-Version": "unknown",
  };

  try {
    const response = await axios.get(url, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ:", error.message);
    throw error;
  }
}

router.post("/getCheckoutList", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await getCheckoutList(cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function buyerCancelCheckout(checkout_id, cookie) {
  const url = "https://mall.shopee.vn/api/v4/order/buyer_cancel_checkout";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  const payload = {
    checkout_id,
    cancel_reason_code: 507,
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi huỷ checkout:", error.message);
    throw error;
  }
}

router.post("/buyerCancelCheckout", async (req, res) => {
  const {cookie, checkout_id} = req.body;
  try {
    const addressData = await buyerCancelCheckout(checkout_id, cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function buyerCancelOrder(order_id, cookie) {
  const url = "https://shopee.vn/api/v4/order/buyer_cancel_order/";

  const csrfToken = (function(
      length,
      characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ) {
    let randomString = ""; // Biến để lưu chuỗi ngẫu nhiên.
    for (let index = 0; index < length; index++) {
      // Lặp qua số lượng ký tự cần tạo.
      const randomIndex = Math.floor(Math.random() * characters.length); // Lấy chỉ số ngẫu nhiên từ dãy ký tự.
      randomString += characters[randomIndex]; // Thêm ký tự ngẫu nhiên vào chuỗi kết quả.
    }
    return randomString;
  })(32);

  const headers = {
    "Cookie": `csrftoken=${csrfToken};${cookie}`,
    "dnt": "1",
    "priority": "u=1, i",
    "referer": `https://shopee.vn/user/purchase/order/${order_id}?type=7`,
    "sec-ch-ua":
      "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "x-api-source": "pc",
    "x-csrftoken": csrfToken,
    "x-shopee-language": "vi",
    "x-sz-sdk-version": "1.12.10",
    "Content-Type": "application/json",
  };

  console.log("Csrftoken:", csrfToken);

  const payload = {
    order_id: Number(order_id), // Convert to number for safety
    cancel_reason_code: 3,
  };

  try {
    console.log("Sending payload:", payload);

    const response = await axios.post(url, payload, {headers});
    console.log("Response data:", response.data);

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}

router.post("/buyerCancelOrder", async (req, res) => {
  const {cookie, order_id} = req.body;
  try {
    const addressData = await buyerCancelOrder(order_id, cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getReturnInfo(order_id, cookie) {
  const url =
    "https://mall.shopee.vn/api/v4/return/return_request/get_return_request_info";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  const payload = {
    order_id,
    return_reason: 111,
    return_type: 1,
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      const datares = {
        return_reasons: response.data.data.return_reason_info,
        item_details: {
          group_id:
            response.data.data.return_item_info.grouped_return_items[0]
                .group_id,
          item_id:
            response.data.data.return_item_info.grouped_return_items[0]
                .item_details[0].item_id,
          model_id:
            response.data.data.return_item_info.grouped_return_items[0]
                .item_details[0].model_id,
          refund_price:
            response.data.data.return_item_info.grouped_return_items[0]
                .item_details[0].refund_price,
          line_item_id:
            response.data.data.return_item_info.grouped_return_items[0]
                .item_details[0].line_item_id,
        },
      };
      return datares;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi huỷ checkout:", error.message);
    throw error;
  }
}

router.post("/getReturnInfo", async (req, res) => {
  const {cookie, order_id} = req.body;
  try {
    const addressData = await getReturnInfo(order_id, cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function requestReturn(
    order_id,
    cookie,
    item_price,
    reason,
    item_id,
    model_id,
    line_item_id,
) {
  const url =
    "https://mall.shopee.vn/api/v4/return/return_request/request_return";

  const csrfToken = (function(
      length,
      characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ) {
    let randomString = "";
    for (let index = 0; index < length; index++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters[randomIndex];
    }
    return randomString;
  })(32);

  const headers = {
    "Cookie": `csrftoken=${csrfToken};${cookie}`,
    "dnt": "1",
    "priority": "u=1, i",
    "referer": `https://shopee.vn/user/purchase/order/${order_id}?type=7`,
    "sec-ch-ua":
      "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "x-api-source": "pc",
    "x-csrftoken": csrfToken,
    "x-shopee-language": "vi",
    "x-sz-sdk-version": "1.12.10",
    "Content-Type": "application/json",
  };

  const payload = {
    order_id: order_id,
    drc_data: {
      solution: 1,
      proposed_refund_amount: item_price,
    },
    return_reason_data: {
      return_reason: reason,
    },
    return_items: [
      {
        item_id: item_id,
        model_id: model_id,
        group_id: "0",
        line_item_id: line_item_id,
        amount: 1,
        base_sku_items: [
          {
            base_sku_item_idx: 0,
            quantity: 1,
          },
        ],
      },
    ],
    issue_type: null,
    request_source_type: 0,
    return_type: 1,
  };
  console.log(payload);
  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi huỷ checkout:", error.message);
    throw error;
  }
}

router.post("/requestReturn", async (req, res) => {
  const {
    order_id,
    cookie,
    item_price,
    reason,
    item_id,
    model_id,
    line_item_id,
  } = req.body;
  try {
    const addressData = await requestReturn(
        order_id,
        cookie,
        item_price,
        reason,
        item_id,
        model_id,
        line_item_id,
    );
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getAccountInfo(cookie) {
  const url = "https://mall.shopee.vn/api/v4/account/basic/get_account_info";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  try {
    const response = await axios.get(url, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi huỷ checkout:", error.message);
    throw error;
  }
}

router.post("/getAccountInfo", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await getAccountInfo(cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function saveVoucher(voucher_code, cookie) {
  const url =
    "https://mall.shopee.vn/api/v2/voucher_wallet/save_platform_voucher_by_voucher_code";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };
  const payload = {
    voucher_code,
  };
  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi lấy voucher", error.message);
    throw error;
  }
}

router.post("/saveVoucher", async (req, res) => {
  const {cookie, voucher_code} = req.body;
  try {
    const addressData = await saveVoucher(voucher_code, cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function updateCheckoutAddress(checkout_id, buyer_address_id, cookie) {
  const url = "https://mall.shopee.vn/api/v4/bmoa/update_checkout_address";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "Af-Ac-Enc-Dat": "",
    "Af-Ac-Enc-Id": "",
    "Af-Ac-Enc-Sz-Token": "",
    "If-None-Match-": "55b03-97d86fe6888b54a9c5bfa268cf3d922f",
    "Shopee_http_dns_mode": "1",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Api-Source": "rn",
    "X-Sap-Access-F": "",
    "X-Sap-Access-T": "",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "X-Csrftoken": "",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };
  const payload = {
    checkout_id,
    buyer_address_id,
  };
  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi lấy voucher", error.message);
    throw error;
  }
}

router.post("/updateCheckoutAddress", async (req, res) => {
  const {checkout_id, buyer_address_id, cookie} = req.body;
  try {
    const addressData = await updateCheckoutAddress(
        checkout_id,
        buyer_address_id,
        cookie,
    );
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getAllOrderAndCheckout(cookie) {
  const url =
    "https://mall.shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=5&offset=0";
  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  try {
    const response = await axios.get(url, {headers});

    // Kiểm tra dữ liệu trả về từ API
    if (!response.data || !response.data.data) {
      throw new Error("Dữ liệu trả về từ API không hợp lệ");
    }

    const {order_data, checkout_data} = response.data.data;

    // Định dạng lại dữ liệu order_data
    const orderData = (order_data?.details_list || []).map((item) => ({
      status: item.status || {},
      shipping: item.shipping ?
        {
          tracking_info: item.shipping.tracking_info || {},
        } :
        {},
      info_card: item.info_card ?
        {
          order_id: item.info_card.order_id,
          checkout_id: item.info_card.checkout_id,
          order_list_cards: (item.info_card.order_list_cards || []).map(
              (card) => ({
                shop_info: card.shop_info || {},
                product_info: card.product_info ?
                {
                  item_groups: card.product_info.item_groups || [],
                } :
                {},
              }),
          ),
          product_count: item.info_card.product_count,
          subtotal: item.info_card.subtotal,
          final_total: item.info_card.final_total,
        } :
        {},
    }));

    // Định dạng lại dữ liệu checkout_data
    const checkoutData = (checkout_data?.details_list || []).map((item) => ({
      info_card: item.info_card ?
        {
          checkout_id: item.info_card.checkout_id,
          order_list_cards: (item.info_card.order_list_cards || []).map(
              (card) => ({
                shop_info: card.shop_info || {},
                product_info: card.product_info ?
                {
                  item_groups: card.product_info.item_groups || [],
                } :
                {},
              }),
          ),
          product_count: item.info_card.product_count,
          subtotal: item.info_card.subtotal,
          checkout_status: item.info_card.checkout_status,
        } :
        {},
    }));

    return {
      order_data: {
        details_list: orderData,
      },
      checkout_data: {
        details_list: checkoutData,
      },
    };
  } catch (error) {
    console.error("Đã xảy ra lỗi khi gọi API:", error.message);
    throw new Error(`Lỗi khi gọi API: ${error.message}`);
  }
}

router.post("/getAllOrderAndCheckout", async (req, res) => {
  const {cookie} = req.body;

  if (!cookie) {
    return res.status(400).json({error: "Cookie là bắt buộc"});
  }

  try {
    const addressData = await getAllOrderAndCheckout(cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

async function getChatToken(cookie) {
  const url =
    "https://banhang.shopee.vn/webchat/api/coreapi/v1.2/mini/login?csrf_token=&source=pcmall&_api_source=pcmall";
  const headers = {
    "accept": "application/json",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "cache-control": "max-age=0",
    "cookie": cookie,
    "priority": "u=0, i",
    "sec-ch-ua": "\"Chromium\";v=\"123\", \"Not:A-Brand\";v=\"8\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "cross-site",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.58 Safari/537.36",
  };

  try {
    const response = await axios.post(url, {}, {headers});
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ:", error.message);
    throw error;
  }
}

router.post("/getChatToken", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await getChatToken(cookie);
    const result = {
      token: addressData.token,
      user: addressData.user,
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getUserShopID(cookie, shopid) {
  const url = `https://sv.shopee.vn/api/v4/shop/get_shop_base?entry_point=ShopByPDP&need_cancel_rate=false&request_source=shop_home_page&shopid=${shopid}&version=2`;
  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "User-Agent":
      "language=vi app_type=1 platform=native_ios appver=32728 os_ver=17.5.1 Cronet/102.0.5005.61",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  try {
    const response = await axios.get(url, {}, {headers});
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ:", error.message);
    throw error;
  }
}

router.post("/getUserShopID", async (req, res) => {
  const {cookie, shopid} = req.body;
  try {
    const addressData = await getUserShopID(cookie, shopid);

    // Chỉ trả ra shopid, userid, và name
    const result = {
      shopid: addressData.data.shopid,
      userid: addressData.data.userid,
      name: addressData.data.name,
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function messages(token, _uid, to_id, text, shop_id, SPC_CDS_CHAT) {
  const url = `https://banhang.shopee.vn/webchat/api/v1.2/mini/messages?_uid=${_uid}&_v=8.5.0&${SPC_CDS_CHAT}&x-shop-region=VN&_api_source=pcmall`;
  const headers = {
    "accept": "application/json",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "cache-control": "max-age=0",
    "authorization": `Bearer ${token}`,
    "priority": "u=0, i",
    "sec-ch-ua": "\"Chromium\";v=\"123\", \"Not:A-Brand\";v=\"8\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "cross-site",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.58 Safari/537.36",
  };
  const payload = {
    request_id: uuidv4(),
    to_id: to_id,
    type: "text",
    content: {
      text: text,
      uid: uuidv4(),
    },
    shop_id: shop_id,
    chat_send_option: {
      force_send_cancel_order_warning: false,
      comply_cancel_order_warning: false,
    },
    entry_point: "product_entry_point",
    choice_info: {
      real_shop_id: null,
    },
    source: "pc_mall",
    re_policy: {
      dfp_access_f: "ExcBAAAABAAAAIAAAAceiScOxQA9fjGgrMIlAwV1DjmVyYbD0t4e1p...",
    },
  };
  try {
    const response = await axios.post(url, payload, {headers});
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy địa chỉ:", error.message);

    // Trả về thêm chi tiết về lỗi
    if (error.response) {
      // Máy chủ trả về một phản hồi lỗi
      console.error("Phản hồi lỗi từ máy chủ:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      throw new Error(
          `Lỗi từ phía máy chủ: ${error.response.status} - ${error.response.data}`,
      );
    } else if (error.request) {
      // Không nhận được phản hồi từ máy chủ
      console.error("Không có phản hồi từ máy chủ:", error.request);
      throw new Error("Không nhận được phản hồi từ máy chủ.");
    } else {
      // Một lỗi khác xảy ra khi thực hiện yêu cầu
      console.error("Lỗi khi thực hiện yêu cầu:", error.message);
      throw new Error(`Lỗi khi thực hiện yêu cầu: ${error.message}`);
    }
  }
}

router.post("/messages", async (req, res) => {
  const {token, _uid, to_id, text, shop_id, SPC_CDS_CHAT} = req.body;
  try {
    const addressData = await messages(
        token,
        _uid,
        to_id,
        text,
        shop_id,
        SPC_CDS_CHAT,
    );
    res.json(addressData);
  } catch (error) {
    // Trả về chi tiết lỗi đầy đủ hơn
    res.status(500).json({
      error: error.message,
    });
  }
});

function hashPassword(password) {
  const md5Hash = crypto.createHash("md5").update(password).digest("hex");
  const sha256Hash = crypto.createHash("sha256").update(md5Hash).digest("hex");
  return sha256Hash;
}

function generateRandomFingerprint(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let fingerprint = "";
  for (let i = 0; i < length; i++) {
    fingerprint += characters.charAt(
        Math.floor(Math.random() * characters.length),
    );
  }
  return fingerprint;
}

router.post("/loginWithPassword", async (req, res) => {
  try {
    const {username, password, spc_f} = req.body;

    // Kiểm tra nếu username bắt đầu bằng "84", thay đổi thành phone
    let postData;
    const hashedPassword = hashPassword(password);
    if (username.startsWith("84")) {
      postData = {
        phone: username, // Dùng "phone" thay vì "username"
        password: hashedPassword,
        support_ivs: true,
        client_identifier: {
          security_device_fingerprint: generateRandomFingerprint(32),
        },
      };
    } else {
      postData = {
        username: username, // Sử dụng "username" như bình thường
        password: hashedPassword,
        support_ivs: true,
        client_identifier: {
          security_device_fingerprint: generateRandomFingerprint(32),
        },
      };
    }

    const headers = {
      "accept": "application/json",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "cache-control": "max-age=0",
      "cookie": spc_f,
      "priority": "u=0, i",
      "sec-ch-ua": "\"Chromium\";v=\"123\", \"Not:A-Brand\";v=\"8\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "cross-site",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.58 Safari/537.36",
    };

    // Gửi yêu cầu POST tới API đăng nhập qua QR code của Shopee
    const loginResponse = await axios.post(
        "https://shopee.vn/api/v4/account/login_by_password",
        postData,
        {headers},
    );

    // Kiểm tra xem phản hồi có chứa cookie không
    if (loginResponse.headers["set-cookie"]) {
      const cookies = loginResponse.headers["set-cookie"];
      const spcStCookie = cookies.find((cookie) => cookie.includes("SPC_ST"));
      if (spcStCookie) {
        // Trả về cookie cho client
        res.status(200).json({
          cookie: spcStCookie.split(";")[0],
          cookieFull: loginResponse.headers["set-cookie"],
        });
      } else {
        // Nếu không tìm thấy cookie SPC_ST, trả về lỗi
        res.status(404).json({
          error: "Cookie SPC_ST không tìm thấy.",
        });
      }
    } else {
      // Nếu không có cookie nào trong phản hồi, trả về lỗi
      res.status(404).json({
        error: "Không tìm thấy cookie trong phản hồi.",
      });
    }
  } catch (error) {
    // Xử lý lỗi khi thực hiện yêu cầu đăng nhập qua QR code
    console.error("Lỗi khi đăng nhập qua QR code:", error.message);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
    });
  }
});

router.get("/hashPassword", async (req, res) => {
  try {
    const {password} = req.query;
    if (!password) {
      return res.status(400).json({
        error: "Mật khẩu không được để trống",
      });
    }

    const hashedPassword = hashPassword(password);
    const security_device_fingerprint = generateRandomFingerprint(32);

    return res.json({
      hashedPassword,
      security_device_fingerprint,
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập qua QR code:", error.message);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
    });
  }
});

async function getAllInfoShopee(cookie) {
  try {
    const accountInfo = await getAccountInfo(cookie);
    const orderIds = [];
    const checkoutIds = [];
    const allOrderDetails = [];
    const allCheckoutDetails = [];
    const orderAndCheckout = await getOrderListAndCheckout(cookie);

    if (Array.isArray(orderAndCheckout.data.order_data.details_list)) {
      orderAndCheckout.data.order_data.details_list.forEach((orderItem) => {
        orderIds.push(orderItem.info_card.order_id);
      });
    } else {
      console.error(
          "Order data details_list is not an array:",
          orderAndCheckout.data.order_data.details_list,
      );
    }

    if (
      orderAndCheckout.data.checkout_data &&
      Array.isArray(orderAndCheckout.data.checkout_data.details_list)
    ) {
      orderAndCheckout.data.checkout_data.details_list.forEach(
          (checkoutItem) => {
            checkoutIds.push(checkoutItem.info_card.checkout_id);
          },
      );
    } else {
      console.error(
          "Checkout data details_list is not an array:",
          orderAndCheckout.data.checkout_data,
      );
    }

    if (orderIds && orderIds.length > 0) {
      const orderDetails = await Promise.all(
          orderIds.map((order_id) => orderDetail(order_id, cookie)),
      );

      allOrderDetails.push({
        cookie,
        orderDetails,
      });
    } else {
      allOrderDetails.push({
        cookie,
        orderDetails: [
          {
            order_id: "",
            tracking_number: "Chưa có dữ liệu",
            tracking_info_description: "Chưa có dữ liệu",
            address: {
              shipping_name: "Chưa có dữ liệu",
              shipping_phone: "Chưa có dữ liệu",
              shipping_address: "Chưa có dữ liệu",
            },
            product_info: [
              {
                item_id: "",
                model_id: "",
                shop_id: "",
                name: "",
                model_name: "",
              },
            ],
          },
        ],
      });
    }

    if (checkoutIds && checkoutIds.length > 0) {
      const checkoutDetails = await Promise.all(
          checkoutIds.map((checkout_id) => checkoutDetail(checkout_id, cookie)),
      );

      allCheckoutDetails.push({
        cookie,
        checkoutDetails,
      });
    } else {
      allCheckoutDetails.push({
        cookie,
        checkoutDetails: [],
      });
    }

    return {
      username: accountInfo.data.username,
      email: accountInfo.data.email,
      phone: accountInfo.data.phone,
      order_data: {
        order_id: orderIds,
        allOrderDetails,
      },
      checkout_data: {
        checkout_id: checkoutIds,
        allCheckoutDetails,
      },
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin", error.message);
    throw error;
  }
}

router.post("/getAllInfoShopee", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await getAllInfoShopee(cookie);
    res.json(addressData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function getOrderListAndCheckout(cookie) {
  const url =
    "https://mall.shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=5&offset=0";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  try {
    const response = await axios.get(url, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách order:", error.message);
    throw error;
  }
}

async function saveVoucher3(cookie) {
  const url = "https://mall.shopee.vn/api/v2/voucher_wallet/save_voucher";

  const headers = {
    "Cookie": cookie,
    "Accept": "application/json",
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip, deflate, br",
  };

  const payload = {
    voucher_promotionid: 1038169732845568,
    signature:
      "9176bd42e4ddcde4c287a5efd70be01c30e420cd702470a992501a770dc1299a",
    security_device_fingerprint: "",
    signature_source: "0",
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
    });
    if (response.status >= 200 && response.status < 300) {
      console.log(response.data);
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi huỷ checkout:", error.message);
    throw error;
  }
}

router.post("/saveVoucher3", async (req, res) => {
  const {cookie} = req.body;
  try {
    const addressData = await saveVoucher3(cookie);
    const error = addressData.error;
    res.json({error});
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

async function createSession() {
  const url =
    "https://chatbot.shopee.vn/api/v2/init_session_v1?entry_point=0&button_type=1&api_version=2&language=vi&client_type=1&support_features=30284-CaseOptionMatch,31864-OtherFrequentlyAsked";

  const headers = {
    "region": "VN",
    "entrypoint-id": "MePage",
  };

  try {
    // Gửi yêu cầu GET để tạo session mới
    const response = await axios.get(url, {headers});

    // Kiểm tra phản hồi từ API
    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data.code === 0
    ) {
      const sessionId = response.data.data.session_id;
      console.log("session_id:", sessionId);
      return sessionId;
    } else {
      throw new Error(
          `API Shopee trả về mã lỗi: ${response.data.code} - ${response.data.msg}`,
      );
    }
  } catch (error) {
    console.error("Lỗi khi gọi API tạo session:", error.message);
    throw error;
  }
}

async function checkso2(phone, session_id) {
  const url = "https://chatbot.shopee.vn/api/v2/message";

  const headers = {
    "region": "VN",
    "entrypoint-id": "MePage",
  };

  const payload = {
    need_filter_message: 1,
    message_text: "Thông tin tài khoản",
    input_type: 1,
    session_id,
    dialogue_id: "1408189021681286272",
    thread_node_id: "",
    thread_id: "",
    thread_id_v2: "1408189027016440960",
    round_id: "1408189027016440961",
    is_bypass: false,
    message_extra: {
      clarification_flag: 1,
      task_bot_action: {
        current_task_bot_info: {
          bot_id: 3,
          case_id: "case_1",
          task_bot_id: "SOP23",
          flow_id: "SOP23_F10",
          editor_node_id: "SOP23_F10_Node5998",
          node_id: "SOP23_Node5998",
          tf_node_id: "SOP23_Node5998",
          report_node_id: "SOP23_F10_Node5998",
          node_name: "Default",
          snapshot_id: "",
          node_type: 3,
        },
        bot_id: 3,
        flow_id: "SOP23_F10",
        snapshot_id: "",
        next_task_bot_id: "",
        next_node_id: "SOP23_Node5998",
        simulation_id: 0,
        params: {
          input_phone: {
            key: "input_phone",
            data_type: 3,
            variate_type: 1,
            is_assigned: true,
            string_val: `84${phone}`,
          },
          input_type: {
            key: "input_type",
            data_type: 1,
            variate_type: 1,
            is_assigned: true,
            int_val: 2,
          },
        },
        button_id: "",
        report_click: false,
        report_click_type: "",
        is_bypass: false,
        interaction_cmd: "check_account_action",
      },
    },
  };

  try {
    const response = await axios.post(url, payload, {headers});
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API Shopee:", error.message);
    throw error;
  }
}

router.get("/checkso2", async (req, res) => {
  const {phone} = req.query;

  try {
    // Tạo session_id mới
    const session_id = await createSession();

    // Gọi API checkso2 với session_id mới
    const addressData = await checkso2(phone, session_id);
    const msg =
      addressData?.data?.replies?.[0]?.message_extra?.control_message?.msg;

    if (msg?.target_user_id === 0) {
      res.json({resolve: true});
    } else if (msg?.shop_id && msg?.user_id) {
      res.json({resolve: false});
    } else {
      res.status(400).json({error: "Dữ liệu không hợp lệ."});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

router.get("/checksoshopee", async (req, res) => {
  const {phone} = req.query;

  try {
    // Tạo session_id mới
    const session_id = await createSession();

    // Gọi API checkso2 với session_id mới
    const addressData = await checkso2(phone, session_id);
    const msg =
      addressData?.data?.replies?.[0]?.message_extra?.control_message?.msg;

    if (msg?.target_user_id === 0) {
      res.json({
        resolve: true,
        infor: {
          shop_id: 0,
          user_id: 0,
        },
        request_id: 0,
      });
    } else if (msg?.shop_id && msg?.user_id) {
      res.json({
        resolve: false,
        infor: {
          shop_id: 0,
          user_id: 0,
        },
        request_id: 0,
      });
    } else {
      res.status(400).json({error: "Dữ liệu không hợp lệ."});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});


router.get("/savelink", async (req, res) => {
  const {link} = req.query;
  if (!link) {
    return res.status(400).send({error: "Missing 'link' parameter"});
  }

  try {
    const linkId = uuidv4();
    const linkData = {
      url: link,
    };

    await db.collection("saved_links").doc(linkId).set(linkData);

    res.send({success: true, data: linkData});
  } catch (error) {
    console.error("Error saving link:", error);
    res.status(500).send({error: "Failed to save link"});
  }
});

router.get("/export-links", async (req, res) => {
  try {
    const snapshot = await db.collection("saved_links").get();
    const urls = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.url) {
        urls.push(data.url);
      }
    });

    if (urls.length === 0) {
      return res.status(404).send("Không có URL nào để xuất.");
    }

    // Thiết lập header để trả về dạng file .txt
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=export.txt");

    // Gửi danh sách URL dưới dạng văn bản
    res.send(urls.join("\n"));
  } catch (error) {
    console.error("Lỗi khi xuất URL:", error);
    res.status(500).send("Lỗi khi truy xuất dữ liệu.");
  }
});

// Route để xuất toàn bộ cookie ra JSON với pagination
router.get("/export-all-cookies", async (req, res) => {
  try {
    console.log("Bắt đầu xuất toàn bộ cookie...");

    const {page = 1, limit = 10000, format = "json"} = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Thiết lập header
    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=cookies_export.json");
    } else {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=cookies_export.txt");
    }

    const cookiesRef = db.collection("cookies");

    // Nếu là trang đầu tiên, trả về thông tin tổng quan
    if (pageNum === 1) {
      const totalSnapshot = await cookiesRef.count().get();
      const totalCount = totalSnapshot.data().count;

      console.log(`Tổng số cookie: ${totalCount}`);

      if (format === "json") {
        res.write("{\"total_count\":" + totalCount + ",\"export_time\":\"" + new Date().toISOString() + "\",\"cookies\":[");
      }
    }

    // Lấy dữ liệu theo trang
    let query = cookiesRef.orderBy("time", "desc");

    // Nếu không phải trang đầu, sử dụng cursor để pagination
    if (pageNum > 1 && req.query.lastDoc) {
      const lastDoc = await cookiesRef.doc(req.query.lastDoc).get();
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(limitNum).get();

    if (snapshot.empty) {
      if (format === "json") {
        res.write("]}");
      }
      res.end();
      return;
    }

    let count = 0;
    let lastDocument = null;

    snapshot.forEach((doc) => {
      const cookieData = doc.data();
      const cookieObj = {
        id: doc.id,
        SPC_ST: cookieData.SPC_ST,
        time: cookieData.time,
        ...cookieData,
      };

      if (format === "json") {
        if (count > 0) res.write(",");
        res.write(JSON.stringify(cookieObj));
      } else {
        res.write(JSON.stringify(cookieObj) + "\n");
      }

      count++;
      lastDocument = doc;

      // Log tiến trình
      if (count % 1000 === 0) {
        console.log(`Đã xử lý ${count} cookie trong trang ${pageNum}...`);
      }
    });

    console.log(`Hoàn thành trang ${pageNum}! Đã xử lý ${count} cookie.`);

    // Nếu còn dữ liệu, trả về thông tin cho trang tiếp theo
    if (snapshot.docs.length === limitNum) {
      const nextPageUrl = `${req.protocol}://${req.get("host")}${req.path}?page=${pageNum + 1}&limit=${limitNum}&format=${format}&lastDoc=${lastDocument.id}`;

      if (format === "json") {
        res.write("],");
        res.write(`"next_page":"${nextPageUrl}","current_page":${pageNum},"items_per_page":${limitNum}`);
        res.write("}");
      } else {
        res.write(`\n--- Next page: ${nextPageUrl} ---\n`);
      }
    } else {
      if (format === "json") {
        res.write("]}");
      }
    }

    res.end();
  } catch (error) {
    console.error("Lỗi khi xuất cookie:", error);
    res.status(500).json({
      error: "Lỗi khi truy xuất dữ liệu cookie",
      message: error.message,
    });
  }
});

// Route để xuất toàn bộ cookie một lần (cho datasets nhỏ hơn)
router.get("/export-all-cookies-simple", async (req, res) => {
  try {
    console.log("Bắt đầu xuất toàn bộ cookie (simple mode)...");

    const cookiesRef = db.collection("cookies");
    const snapshot = await cookiesRef.orderBy("time", "desc").limit(50000).get(); // Giới hạn 50k để tránh timeout

    const allCookies = [];
    let count = 0;

    snapshot.forEach((doc) => {
      const cookieData = doc.data();
      allCookies.push({
        id: doc.id,
        SPC_ST: cookieData.SPC_ST,
        time: cookieData.time,
        ...cookieData,
      });
      count++;

      if (count % 1000 === 0) {
        console.log(`Đã xử lý ${count} cookie...`);
      }
    });

    console.log(`Hoàn thành! Tổng cộng ${count} cookie được xuất.`);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=cookies_export_simple.json");

    res.json({
      total_count: count,
      export_time: new Date().toISOString(),
      cookies: allCookies,
    });
  } catch (error) {
    console.error("Lỗi khi xuất cookie:", error);
    res.status(500).json({
      error: "Lỗi khi truy xuất dữ liệu cookie",
      message: error.message,
    });
  }
});

async function saveVoucherShopee(cookie, voucher_promotionid, signature, voucher_code) {
  const url = "https://mall.shopee.vn/api/v2/voucher_wallet/save_vouchers";

  const headers = {
    "Cookie": cookie,
    "Content-Type": "application/json",
  };

  const payload = {
    "voucher_identifiers": [
      {
        "promotion_id": parseInt(voucher_promotionid),
        "voucher_code": voucher_code,
        "signature": signature,
        "signature_source": 0,
      },
    ],
    "need_user_voucher_status": true,
  };

  try {
    const response = await axios.post(url, payload, {
      headers,
      maxBodyLength: Infinity,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    console.error("Lỗi khi save voucher:", error.message);
    throw error;
  }
}

router.post("/saveVoucherShopee", async (req, res) => {
  const {cookie, voucher_promotionid, signature, voucher_code} = req.body;
  try {
    const addressData = await saveVoucherShopee(cookie, voucher_promotionid, signature, voucher_code);

    // Trả về error và error_msg từ response của Shopee
    if (addressData.responses && addressData.responses.length > 0) {
      const firstResponse = addressData.responses[0];
      return res.json(firstResponse);
    } else {
      res.json({
        error: addressData.error || 0,
        error_msg: addressData.error_msg || null,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/getFreeship", async (req, res) => {
  try {
    const timestamp = Date.now();
    const url = `https://4anm.top/get5.json?v=${timestamp}`;

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (response.status === 200 && response.data) {
      const items = Array.isArray(response.data.items) ? response.data.items : [];
      const normalized = items.map((item) => {
        try {
          const parsed = new URL(item.url);
          const voucherCode = parsed.searchParams.get("voucherCode");
          const promotionId = parsed.searchParams.get("promotionId");
          const signature = parsed.searchParams.get("signature");
          return {
            voucherCode,
            promotionId,
            signature,
            voucherName: item.term,
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      return res.json(normalized);
    } else {
      return res.status(500).json({
        error: "Failed to fetch freeship data",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error fetching freeship data:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/getVoucher", async (req, res) => {
  try {
    const url = "https://4anm.top/get.json";

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (response.status === 200 && response.data) {
      const items = Array.isArray(response.data.items) ? response.data.items : [];
      const normalized = items.map((item) => {
        try {
          const parsed = new URL(item.url);
          const voucherCode = parsed.searchParams.get("voucherCode");
          const promotionId = parsed.searchParams.get("promotionId");
          const signature = parsed.searchParams.get("signature");
          return {
            voucherCode,
            promotionId,
            signature,
            voucherName: item.term,
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      return res.json(normalized);
    } else {
      return res.status(500).json({
        error: "Failed to fetch voucher data",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error fetching voucher data:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.post("/getquest", async (req, res) => {
  try {
    const {cookie, userId} = req.body;

    const url = `https://idgame.shopee.vn/api/buyer-mission/v2/quests/34b56a57fdc17f6f?view_source=lp`;

    const headers = {
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-app-version-name": "28320",
      "x-session-id": "country_vn_event_34b56a57fdc17f6f",
      "x-dfp": "x3Tpx8NunU731xtMyixOwQ==|x+6KHKVtV9Twk53Tsu7RKimdQBn59HL6909CMRCXa5eeAS3/vGS1ovpNmyPX9uGFRwp8mmKazW1InlTNum/m2riMihC655G8dx9Gyg==|q5wJDviIKCZWJ9Bo|08|1",
      "x-platform": "4",
      "x-useragenttype": "2",
      "x-clienttype": "3",
      "Cookie": cookie,
    };

    const body = {
      invitation_code: "",
      with_config: true,
    };

    const response = await axios.post(url, body, {
      headers,
      timeout: 30000,
    });

    const raw = response?.data || {};
    const taskUsers =
      Array.isArray(raw?.data?.task_users) ? raw.data.task_users : [];

    const simplified = taskUsers.map((tu) => {
      const t = tu?.task || {};
      let ac = t.assets_config;
      if (typeof ac === "string") {
        try {
          ac = JSON.parse(ac);
        } catch {
          ac = {};
        }
      }
      ac = ac && typeof ac === "object" ? ac : {};

      return {
        task: {
          id: t.id,
          task_name: t.task_name,
          reward_stock: t.reward_stock,
          reward_amount: t.reward_amount,
          assets_config: {
            shop_id: ac.shop_id,
            shop_username: ac.shop_username,
          },
        },
        task_finish_status: tu.task_finish_status,
        action_num: tu.action_num,
        last_update_time: tu.last_update_time,
        redeemable: tu.redeemable,
      };
    });

    return res.json({
      msg: "SUCCESS",
      code: 0,
      data: {
        task_users: simplified,
      },
    });
  } catch (err) {
    console.error("getquest error:", err?.message);
    const backendMsg = err?.response?.data?.msg || err?.message || "Unknown";
    const backendCode = err?.response?.data?.code ?? 500;
    return res.status(500).json({
      msg: backendMsg,
      code: backendCode,
      data: {},
    });
  }
});

router.post("/followShop", async (req, res) => {
  try {
    const {cookie, shopid} = req.body;

    if (!cookie || !shopid) {
      return res.status(400).json({
        error: "Missing required fields: cookie or shopid",
      });
    }

    const url = "https://mall.shopee.vn/api/v4/shop/follow";

    const headers = {
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Cookie": cookie,
    };

    const payload = {
      shopid: parseInt(shopid),
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: 30000,
    });

    if (response.status === 200 && response.data) {
      return res.json(response.data);
    } else {
      return res.status(500).json({
        error: "Failed to follow shop",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error following shop:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.post("/getUserCoins", async (req, res) => {
  try {
    const {cookie} = req.body;

    if (!cookie) {
      return res.status(400).json({
        error: "Missing required field: cookie",
      });
    }

    const url = "https://shopee.vn/api/v4/coin/get_user_coins_summary";

    const headers = {
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "Cookie": cookie,
    };

    const response = await axios.get(url, {
      headers,
      timeout: 30000,
    });

    if (response.status === 200 && response.data) {
      // Chỉ trả về các field cần thiết
      const simplifiedResponse = {
        bff_meta: response.data.bff_meta,
        error: response.data.error,
        error_msg: response.data.error_msg,
        coins: {
          user_id: response.data.coins?.user_id,
          available_amount: response.data.coins?.available_amount,
        },
      };

      return res.json(simplifiedResponse);
    } else {
      return res.status(500).json({
        error: "Failed to get user coins",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error getting user coins:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.post("/getReward", async (req, res) => {
  try {
    const {cookie, taskId, userId} = req.body;

    if (!cookie) {
      return res.status(400).json({
        error: "Missing required fields: cookie or meta_dfp",
      });
    }

    const url = `https://idgame.shopee.vn/api/buyer-mission/v2/quests/34b56a57fdc17f6f/tasks/${taskId}/get-reward`;

    const headers = {
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
      "x-app-version-name": "28320",
      "x-session-id": `country_vn_event_34b56a57fdc17f6f_task_${taskId}`,
      "x-dfp": "x3Tpx8NunU731xtMyixOwQ==|x+6KHKVtV9Twk53Tsu7RKimdQBn59HL6909CMRCXa5eeAS3/vGS1ovpNmyPX9uGFRwp8mmKazW1InlTNum/m2riMihC655G8dx9Gyg==|q5wJDviIKCZWJ9Bo|08|1",
      "x-platform": "4",
      "x-useragenttype": "2",
      "x-clienttype": "3",
      "Cookie": `SPC_U=${userId};${cookie}`,
    };

    const payload = {
      meta_dfp: "x3Tpx8NunU731xtMyixOwQ==|x+6KHKVtV9Twk53Tsu7RKimdQBn59HL6909CMRCXa5eeAS3/vGS1ovpNmyPX9uGFRwp8mmKazW1InlTNum/m2riMihC655G8dx9Gyg==|q5wJDviIKCZWJ9Bo|08|1",
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: 30000,
    });

    if (response.status === 200 && response.data) {
      return res.json(response.data);
    } else {
      return res.status(500).json({
        error: "Failed to get reward",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error getting reward:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.post("/getvoucherwithcoin", async (req, res) => {
  try {
    const {cookie} = req.body;

    if (!cookie) {
      return res.status(400).json({
        error: "Missing required field: cookie",
      });
    }

    const url = "https://loyalty.shopee.vn/api/v1/coins/benefits";

    const headers = {
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Cookie": cookie,
    };

    const response = await axios.get(url, {
      headers,
      timeout: 30000,
    });

    if (response.status === 200 && response.data) {
      return res.json(response.data);
    } else {
      return res.status(500).json({
        error: "Failed to get voucher with coin",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error getting voucher with coin:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.post("/claimVoucherWithCoin", async (req, res) => {
  try {
    const {cookie, benefit_id, voucher_code} = req.body;

    if (!cookie || !benefit_id || !voucher_code) {
      return res.status(400).json({
        error: "Missing required fields: cookie, benefit_id, or voucher_code",
      });
    }

    const url = "https://loyalty.shopee.vn/api/v1/claim/coins/voucher";

    const headers = {
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
      "Cookie": cookie,
    };

    const payload = {
      benefit_id: parseInt(benefit_id),
      voucher_code: voucher_code,
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: 30000,
    });

    if (response.status === 200 && response.data) {
      return res.json(response.data);
    } else {
      return res.status(500).json({
        error: "Failed to claim voucher with coin",
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error claiming voucher with coin:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
