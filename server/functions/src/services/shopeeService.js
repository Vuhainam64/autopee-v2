/**
 * Shopee Service
 * Business logic for Shopee API operations
 */

/* eslint-disable camelcase, max-len, operator-linebreak */
const axios = require("axios");
const logger = require("../utils/logger");

/**
 * Get all orders and checkouts
 * @param {string} cookie - Shopee cookie
 * @param {number} limit - Limit of results (default: 5)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<object>} Order and checkout data
 */
const getAllOrderAndCheckout = async (cookie, limit = 5, offset = 0) => {
  try {
    const url = `https://mall.shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=${limit}&offset=${offset}`;
    const headers = {
      "Cookie": cookie,
      "Accept": "application/json",
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
      "Content-Type": "application/json; charset=utf-8",
      "Accept-Encoding": "gzip, deflate, br",
    };

    const response = await axios.get(url, {headers});

    if (!response.data || !response.data.data) {
      throw new Error("Dữ liệu trả về từ API không hợp lệ");
    }

    const {order_data, checkout_data} = response.data.data;

    // Format order_data
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

    // Format checkout_data
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
    logger.error("Failed to get all orders and checkouts", error, {cookie});
    throw new Error(`Lỗi khi gọi API: ${error.message}`);
  }
};

/**
 * Get order detail by order_id
 * @param {string|number} orderId - Order ID
 * @param {string} cookie - Shopee cookie
 * @returns {Promise<object>} Order detail
 */
const getOrderDetail = async (orderId, cookie) => {
  try {
    const url = `https://mall.shopee.vn/api/v4/order/get_order_detail?order_id=${orderId}`;
    const headers = {
      "Cookie": cookie,
      "Accept": "application/json",
      "User-Agent": "Android app Shopee appver=28320 app_type=1",
      "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
      "Content-Type": "application/json; charset=utf-8",
      "Accept-Encoding": "gzip, deflate, br",
    };

    const response = await axios.get(url, {headers});
    const data = response.data?.data;

    if (!data) {
      logger.warn("No data returned for order", {orderId});
      return {
        order_id: orderId,
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

    // Check if order is cancelled
    const isCancelled =
      data.status?.status_label?.text === "label_order_cancelled";

    const address = {
      shipping_name: data.address?.shipping_name || "Không xác định",
      shipping_phone: data.address?.shipping_phone || "Không xác định",
      shipping_address: data.address?.shipping_address || "Không xác định",
    };

    return {
      order_id: orderId,
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
    logger.error("Failed to get order detail", error, {orderId, cookie});
    return {
      order_id: orderId,
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
};

/**
 * Get multiple order details
 * @param {Array<string|number>} orderIds - Array of order IDs
 * @param {string} cookie - Shopee cookie
 * @returns {Promise<Array<object>>} Array of order details
 */
const getOrderDetails = async (orderIds, cookie) => {
  try {
    const orderDetails = await Promise.all(
        orderIds.map((orderId) => getOrderDetail(orderId, cookie)),
    );
    return orderDetails;
  } catch (error) {
    logger.error("Failed to get order details", error, {orderIds, cookie});
    throw error;
  }
};

/**
 * Get order list
 * @param {string} cookie - Shopee cookie
 * @param {number} limit - Limit of results (default: 10)
 * @param {number} listType - List type (default: 3)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<object>} Order list data
 */
const getOrderList = async (cookie, limit = 10, listType = 3, offset = 0) => {
  try {
    const url = `https://mall.shopee.vn/api/v4/order/get_order_list?call_recommendation_orders_count_threshold=3&limit=${limit}&list_type=${listType}&offset=${offset}&recommendation_limit=6&view_session_id=f8g3b30QKGBOH4kDmuxnKUiPcSis19rxaECQjN0O48I%3D-1714142228911`;

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

    const response = await axios.get(url, {headers});

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    logger.error("Failed to get order list", error, {cookie});
    throw error;
  }
};

/**
 * Get checkout list
 * @param {string} cookie - Shopee cookie
 * @param {number} cursor - Cursor for pagination (default: 0)
 * @param {number} limit - Limit of results (default: 10)
 * @returns {Promise<object>} Checkout list data
 */
const getCheckoutList = async (cookie, cursor = 0, limit = 10) => {
  try {
    const url = `https://mall.shopee.vn/api/v4/order/get_checkout_list?cursor=${cursor}&limit=${limit}`;

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

    const response = await axios.get(url, {headers});

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`API Shopee trả về mã lỗi: ${response.status}`);
    }
  } catch (error) {
    logger.error("Failed to get checkout list", error, {cookie});
    throw error;
  }
};

/**
 * Fetch order + checkout list directly from Shopee by cookie
 * @param {string} cookie - Shopee cookie (SPC_ST=...)
 * @param {object} options - {limit, listType, offset}
 * @returns {Promise<object>} {orderData, checkoutData, nextOffset}
 */
const fetchOrdersByCookie = async (
    cookie,
    {limit = 10, listType = 7, offset = 0} = {},
) => {
  const url = "https://mall.shopee.vn/api/v4/order/"
    + `get_all_order_and_checkout_list?_oft=3&limit=${limit}`
    + `&list_type=${listType}&offset=${offset}`;

  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
    "Accept": "application/json",
  };

  const response = await axios.get(url, {headers});
  const data = response.data?.data;

  return {
    orderData: data?.order_data?.details_list || [],
    checkoutData: data?.checkout_data?.details_list || [],
    nextOffset: data?.next_offset ?? null,
  };
};

/**
 * Get order lists for multiple cookies (new flow: direct API call)
 * @param {Array<string>} cookies - Array of Shopee cookies
 * @param {object} options - {limit, listType, offset}
 * @returns {Promise<Array<object>>} results per cookie
 */
const getOrderDetailsForCookie = async (cookies, options = {}) => {
  const results = [];

  for (const cookie of cookies) {
    try {
      const data = await fetchOrdersByCookie(cookie, options);
      results.push({
        cookie,
        orderData: data.orderData,
        checkoutData: data.checkoutData,
        nextOffset: data.nextOffset,
      });
    } catch (error) {
      logger.error("Failed to fetch orders by cookie", error, {cookie});
      results.push({
        cookie,
        error: error.message || "Failed to fetch orders",
      });
    }
  }

  return results;
};

/**
 * Fetch checkout detail by checkout_id
 * @param {string} cookie - Shopee cookie
 * @param {string|number} checkoutId - checkout_id
 * @returns {Promise<object>} checkout detail data
 */
const fetchCheckoutDetail = async (cookie, checkoutId) => {
  const url = "https://mall.shopee.vn/api/v4/order/"
    + `get_checkout_detail_v2?_oft=35&checkout_id=${checkoutId}`;

  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
    "Accept": "application/json",
  };

  const response = await axios.get(url, {headers});
  return response.data?.data;
};

/**
 * Get order detail for cancelled orders
 * @param {string} cookie - Shopee cookie
 * @param {string|number} orderId - order_id
 * @returns {Promise<object>} order detail data
 */
const fetchOrderDetailCancelled = async (cookie, orderId) => {
  const url = "https://mall.shopee.vn/api/v4/order/"
    + `get_order_detail_v2?_oft=35&order_id=${orderId}`;

  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
    "Accept": "application/json",
  };

  const response = await axios.get(url, {headers});
  return response.data?.data || response.data;
};

/**
 * Cancel order by order_id
 * @param {string} cookie - Shopee cookie
 * @param {string|number} orderId - order_id
 * @param {number} cancelReasonCode - reason code (e.g., 3)
 * @returns {Promise<object>} cancel result
 */
const cancelOrder = async (cookie, orderId, cancelReasonCode = 3) => {
  const url = "https://mall.shopee.vn/api/v4/order/buyer_cancel_order";
  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const payload = {
    order_id: Number(orderId),
    cancel_reason_code: cancelReasonCode,
  };

  const response = await axios.post(url, payload, {headers});
  return response.data?.data || response.data;
};

/**
 * Get cancel detail for cancelled order
 * @param {string} cookie - Shopee cookie
 * @param {string|number} orderId - order_id
 * @returns {Promise<object>} cancel detail
 */
const fetchCancelDetail = async (cookie, orderId) => {
  const url = "https://mall.shopee.vn/api/v4/order/"
    + `get_buyer_requested_cancel_order_details?order_id=${orderId}`;

  const headers = {
    "User-Agent": "Android app Shopee appver=28320 app_type=1",
    "X-Shopee-Client-Timezone": "Asia/Ho_Chi_Minh",
    "Cookie": cookie,
    "Accept": "application/json",
  };

  const response = await axios.get(url, {headers});
  return response.data?.data || response.data;
};

module.exports = {
  getAllOrderAndCheckout,
  getOrderDetail,
  getOrderDetails,
  getOrderList,
  getCheckoutList,
  getOrderDetailsForCookie,
  fetchOrdersByCookie,
  fetchCheckoutDetail,
  fetchOrderDetailCancelled,
  cancelOrder,
  fetchCancelDetail,
};

