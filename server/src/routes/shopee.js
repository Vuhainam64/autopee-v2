const express = require("express");
const { handleAsync } = require("../middleware/error");
const {
  fetchAllOrdersAndCheckouts,
  fetchOrderDetailV2,
  genQrCode,
  checkQrStatus,
  loginQr,
} = require("../services/shopeeService");

const router = express.Router();

router.post(
  "/orders",
  handleAsync(async (req, res) => {
    const { cookie, limit, list_type, offset } = req.body;
    if (!cookie) {
      return res
        .status(400)
        .json({ success: false, error: { message: "cookie là bắt buộc" } });
    }
    const data = await fetchAllOrdersAndCheckouts(cookie, {
      limit,
      listType: list_type,
      offset,
    });
    res.json({ success: true, data });
  }),
);

router.post(
  "/order-detail",
  handleAsync(async (req, res) => {
    const { cookie, order_id } = req.body;
    if (!cookie || !order_id) {
      return res.status(400).json({
        success: false,
        error: { message: "cookie và order_id là bắt buộc" },
      });
    }
    const data = await fetchOrderDetailV2(cookie, order_id);
    res.json({ success: true, data });
  }),
);

router.get(
  "/qr",
  handleAsync(async (_req, res) => {
    const data = await genQrCode();
    res.json({ success: true, data });
  }),
);

router.get(
  "/qr/status",
  handleAsync(async (req, res) => {
    const { qrcode_id } = req.query;
    if (!qrcode_id) {
      return res
        .status(400)
        .json({ success: false, error: { message: "qrcode_id is required" } });
    }
    const data = await checkQrStatus(qrcode_id);
    res.json({ success: true, data });
  }),
);

router.post(
  "/qr/login",
  handleAsync(async (req, res) => {
    const { qrcode_token } = req.body;
    if (!qrcode_token) {
      return res.status(400).json({
        success: false,
        error: { message: "qrcode_token is required" },
      });
    }
    const data = await loginQr(qrcode_token);
    res.json({ success: true, data });
  }),
);

module.exports = router;


