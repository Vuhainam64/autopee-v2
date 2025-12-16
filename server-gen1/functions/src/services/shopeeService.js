const axios = require("axios");
const logger = require("../utils/logger");

const UA_WEB =
  "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 ShopeeApp";

const HEADERS_GET = {
  "User-Agent": UA_WEB,
  "Accept": "application/json",
  "Accept-Language": "vi-VN,vi;q=0.9",
  "Origin": "https://shopee.vn",
  "Referer": "https://shopee.vn/",
};

const HEADERS_POST_JSON = {
  ...HEADERS_GET,
  "Content-Type": "application/json",
};

const fetchAllOrdersAndCheckouts = async (cookie, {limit = 10, listType = 7, offset = 0} = {}) => {
  const url =
    `https://mall.shopee.vn/api/v4/order/get_all_order_and_checkout_list` +
    `?_oft=3&limit=${limit}&list_type=${listType}&offset=${offset}`;
  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
  };

  const resp = await axios.get(url, {headers});
  if (!resp.data || resp.data.error !== 0) {
    throw new Error(resp.data?.error_msg || "Shopee API error");
  }
  return resp.data.data;
};

const fetchOrderDetailV2 = async (cookie, orderId) => {
  const url = `https://mall.shopee.vn/api/v4/order/get_order_detail_v2?_oft=3&order_id=${orderId}`;
  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
  };

  const resp = await axios.get(url, {headers});
  if (!resp.data || resp.data.error !== 0) {
    throw new Error(resp.data?.error_msg || "Shopee order detail error");
  }
  return resp.data.data;
};

const genQrCode = async () => {
  const resp = await axios.get("https://shopee.vn/api/v2/authentication/gen_qrcode", {
    headers: HEADERS_GET,
  });
  if (resp.status === 200 && resp.data?.data) return resp.data.data;
  throw new Error("Failed to generate QR");
};

const checkQrStatus = async (qrcodeId) => {
  const url =
    `https://shopee.vn/api/v2/authentication/qrcode_status` +
    `?qrcode_id=${encodeURIComponent(qrcodeId)}`;
  const resp = await axios.get(url, {headers: HEADERS_GET});
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
      {headers: HEADERS_POST_JSON},
  );
  const setCookie = resp.headers?.["set-cookie"] || [];
  const pick =
    setCookie.find((c) => c.includes("SPC_ST")) ||
    setCookie.find((c) => c.includes("SPC_T_ID")) ||
    setCookie.find((c) => c.includes("SPC_R_T_ID")) ||
    setCookie[0];
  if (!pick) {
    logger.error("loginQr: no SPC cookie found", {
      status: resp.status,
      headers: resp.headers,
      data: resp.data,
      cookies: setCookie,
    });
    return {cookie: "", cookies: setCookie, raw: resp.data};
  }
  logger.info("loginQr: got cookie", {
    status: resp.status,
    cookies: setCookie,
  });
  const joined = setCookie.map((c) => c.split(";")[0]).join("; ");
  return {
    cookie: pick.split(";")[0],
    cookies: setCookie,
    cookieFull: joined,
    raw: resp.data,
  };
};

module.exports = {
  fetchAllOrdersAndCheckouts,
  fetchOrderDetailV2,
  genQrCode,
  checkQrStatus,
  loginQr,
  HEADERS_GET,
  HEADERS_POST_JSON,
};

