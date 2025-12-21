const express = require("express");
const { authenticate } = require("../middleware/auth");
const { handleAsync } = require("../middleware/error");
const {
  fetchAllOrdersAndCheckouts,
  fetchOrderDetailV2,
  genQrCode,
  checkQrStatus,
  loginQr,
} = require("../services/shopeeService");
const UserCookie = require("../models/UserCookie");

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

    // Thử lấy userId từ token nếu có (optional authenticate)
    let userId = "guest"; // Mặc định là guest nếu không có token
    try {
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.replace("Bearer ", "");
        const { admin } = require("../firebase");
        const decoded = await admin.auth().verifyIdToken(idToken);
        userId = decoded.uid;
      }
    } catch (error) {
      // Không có token hoặc token không hợp lệ, dùng userId = "guest"
      userId = "guest";
    }

    // Lưu cookie vào database (async, không block response)
    UserCookie.findOneAndUpdate(
      {
        userId: userId,
        cookie: cookie.trim(),
      },
      {
        userId: userId,
        cookie: cookie.trim(),
        name: "Shopee Orders API",
        isActive: true,
        lastUsedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    ).catch((err) => {
      console.error("Error saving cookie:", err);
    });

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

    // Thử lấy userId từ token nếu có (optional authenticate)
    let userId = "guest"; // Mặc định là guest nếu không có token
    try {
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.replace("Bearer ", "");
        const { admin } = require("../firebase");
        const decoded = await admin.auth().verifyIdToken(idToken);
        userId = decoded.uid;
      }
    } catch (error) {
      // Không có token hoặc token không hợp lệ, dùng userId = "guest"
      userId = "guest";
    }

    // Lưu cookie vào database (async, không block response)
    UserCookie.findOneAndUpdate(
      {
        userId: userId,
        cookie: cookie.trim(),
      },
      {
        userId: userId,
        cookie: cookie.trim(),
        name: "Shopee Order Detail API",
        isActive: true,
        lastUsedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    ).catch((err) => {
      console.error("Error saving cookie:", err);
    });

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
  authenticate,
  handleAsync(async (req, res) => {
    const { qrcode_token } = req.body;
    if (!qrcode_token) {
      return res.status(400).json({
        success: false,
        error: { message: "qrcode_token is required" },
      });
    }
    const data = await loginQr(qrcode_token);
    
    // Lưu cookie từ QR login vào database (async, không block response)
    if (req.user?.uid && data?.cookie) {
      UserCookie.findOneAndUpdate(
        {
          userId: req.user.uid,
          cookie: data.cookie.trim(),
        },
        {
          userId: req.user.uid,
          cookie: data.cookie.trim(),
          name: "QR Login",
          isActive: true,
          lastUsedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      ).catch((err) => {
        console.error("Error saving QR cookie:", err);
      });
    }
    
    res.json({ success: true, data });
  }),
);

module.exports = router;


