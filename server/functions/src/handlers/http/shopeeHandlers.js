/* eslint-disable camelcase */
const {handleHTTPErrors} = require("../../middleware");
const {
  fetchAllOrdersAndCheckouts,
  fetchOrderDetailV2,
  genQrCode,
  checkQrStatus,
  loginQr,
} = require("../../services/shopeeService");

const withCors = (handler) => async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  return handler(req, res);
};

/**
 * Get orders + checkouts list by cookie
 * POST /getAllOrdersAndCheckouts
 * body: { cookie, limit?, list_type?, offset? }
 */
exports.getAllOrdersAndCheckouts = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const {cookie, limit, list_type, offset} = req.body;
      if (!cookie) {
        return res.status(400).json({success: false, error: {message: "cookie là bắt buộc"}});
      }

      const data = await fetchAllOrdersAndCheckouts(cookie, {
        limit,
        listType: list_type,
        offset,
      });

      res.json({success: true, data});
    }),
);

/**
 * Get order detail v2 by order_id
 * POST /getOrderDetail
 * body: { cookie, order_id }
 */
exports.getOrderDetail = withCors(
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({success: false, error: {message: "Method not allowed"}});
      }

      const {cookie, order_id} = req.body;
      if (!cookie || !order_id) {
        return res.status(400).json({
          success: false,
          error: {message: "cookie và order_id là bắt buộc"},
        });
      }

      const data = await fetchOrderDetailV2(cookie, order_id);
      res.json({success: true, data});
    }),
);

/**
 * Generate QR code for Shopee login
 * GET /genShopeeQR
 */
exports.genShopeeQR = withCors(
    handleHTTPErrors(async (req, res) => {
      const data = await genQrCode();
      res.json({success: true, data});
    }),
);

/**
 * Check QR status
 * GET /checkShopeeQR?qrcode_id=...
 */
exports.checkShopeeQR = withCors(
    handleHTTPErrors(async (req, res) => {
      const {qrcode_id} = req.query;
      if (!qrcode_id) {
        return res.status(400).json({success: false, error: {message: "qrcode_id is required"}});
      }
      const data = await checkQrStatus(qrcode_id);
      res.json({success: true, data});
    }),
);

/**
 * Login QR
 * POST /loginShopeeQR { qrcode_token }
 */
exports.loginShopeeQR = withCors(
    handleHTTPErrors(async (req, res) => {
      const {qrcode_token} = req.body;
      if (!qrcode_token) {
        return res.status(400).json({success: false, error: {message: "qrcode_token is required"}});
      }
      const data = await loginQr(qrcode_token);
      res.json({success: true, data});
    }),
);
