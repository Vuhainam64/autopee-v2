const express = require("express");
const { authenticate } = require("../middleware/auth");
const { handleAsync } = require("../middleware/error");
const {
  fetchAllOrdersAndCheckouts,
  fetchOrderDetailV2,
  genQrCode,
  checkQrStatus,
  loginQr,
  checkPhone,
} = require("../services/shopeeService");
const {
  getAvailableCookie,
  incrementCookieUsage,
  saveCookie,
} = require("../services/cookieService");
const User = require("../models/User");
const UsageHistory = require("../models/UsageHistory");

const router = express.Router();

router.post(
  "/orders",
  handleAsync(async (req, res) => {
    const { cookie: cookieFromBody, limit, list_type, offset } = req.body;

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

    // Lấy cookie từ database nếu không có trong request body
    let cookie = cookieFromBody;
    let cookieDoc = null;

    if (!cookie) {
      // Tự động lấy cookie từ database, ưu tiên cookie ít sử dụng nhất
      cookieDoc = await getAvailableCookie(userId);
      if (!cookieDoc) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Không tìm thấy cookie. Vui lòng cung cấp cookie hoặc đảm bảo đã có cookie trong hệ thống.",
          },
        });
      }
      cookie = cookieDoc.cookie;
    } else {
      // Nếu có cookie từ body, lưu vào database
      cookieDoc = await saveCookie(userId, cookie, "Shopee Orders API");
    }

    // Tăng usageCount nếu cookie được lấy từ database
    if (cookieDoc && cookieDoc._id) {
      incrementCookieUsage(cookieDoc._id).catch((err) => {
        console.error("Error incrementing cookie usage:", err);
      });
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
    const { cookie: cookieFromBody, order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: { message: "order_id là bắt buộc" },
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

    // Lấy cookie từ database nếu không có trong request body
    let cookie = cookieFromBody;
    let cookieDoc = null;

    if (!cookie) {
      // Tự động lấy cookie từ database, ưu tiên cookie ít sử dụng nhất
      cookieDoc = await getAvailableCookie(userId);
      if (!cookieDoc) {
      return res.status(400).json({
        success: false,
          error: {
            message:
              "Không tìm thấy cookie. Vui lòng cung cấp cookie hoặc đảm bảo đã có cookie trong hệ thống.",
          },
        });
      }
      cookie = cookieDoc.cookie;
    } else {
      // Nếu có cookie từ body, lưu vào database
      cookieDoc = await saveCookie(userId, cookie, "Shopee Order Detail API");
    }

    // Tăng usageCount nếu cookie được lấy từ database
    if (cookieDoc && cookieDoc._id) {
      incrementCookieUsage(cookieDoc._id).catch((err) => {
        console.error("Error incrementing cookie usage:", err);
      });
    }

    try {
      const data = await fetchOrderDetailV2(cookie, order_id);
      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching order detail:", error.message);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || "Shopee order detail error",
        },
      });
    }
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
      saveCookie(req.user.uid, data.cookie, "QR Login").catch((err) => {
        console.error("Error saving QR cookie:", err);
      });
    }
    
    res.json({ success: true, data });
  }),
);

// POST /shopee/check-phone - Kiểm tra số điện thoại có tồn tại trên Shopee hay không
// Yêu cầu authentication (role user trở lên)
router.post(
  "/check-phone",
  authenticate,
  handleAsync(async (req, res) => {
    const { phone, cookie: cookieFromBody } = req.body;
    const userId = req.user.uid;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: { message: "phone là bắt buộc" },
      });
    }

    // Lấy cookie từ database nếu không có trong request body
    let cookieDoc = null;
    let cookieToUse = cookieFromBody;
    
    if (!cookieToUse) {
      // Tự động lấy cookie từ database, ưu tiên cookie ít sử dụng nhất
      cookieDoc = await getAvailableCookie(userId);
      if (cookieDoc) {
        cookieToUse = cookieDoc.cookie;
      }
    } else {
      // Nếu có cookie từ body, lưu vào database
      cookieDoc = await saveCookie(userId, cookieToUse, "Shopee Check Phone API");
    }

    // Tăng usageCount nếu cookie được lấy từ database
    if (cookieDoc && cookieDoc._id) {
      incrementCookieUsage(cookieDoc._id).catch((err) => {
        console.error("[API] Error incrementing cookie usage:", err);
      });
    }

    try {
      // Kiểm tra số điện thoại
      const result = await checkPhone(phone, cookieToUse);
      
      // Tính giá dựa trên kết quả
      // 1000 VND nếu chưa tồn tại, 100 VND nếu đã tồn tại
      const amount = result.exists ? 100 : 1000;
      
      console.log(`[API] POST /shopee/check-phone - Phone: ${phone}, Exists: ${result.exists}, Amount: ${amount} VND`);
      
      // Lấy số dư hiện tại của user
      const user = await User.findOne({ uid: userId });
      if (!user) {
        console.log(`[API] POST /shopee/check-phone - User not found: ${userId}`);
        return res.status(404).json({
          success: false,
          error: { message: "Không tìm thấy thông tin người dùng" },
        });
      }
      
      const currentBalance = user.walletBalance || 0;
      console.log(`[API] POST /shopee/check-phone - User: ${userId}, Current Balance: ${currentBalance} VND`);
      
      // Kiểm tra số dư đủ không
      if (currentBalance < amount) {
        console.log(`[API] POST /shopee/check-phone - Insufficient balance: ${currentBalance} < ${amount}`);
        return res.status(400).json({
          success: false,
          error: { 
            message: `Số dư không đủ. Cần ${amount.toLocaleString('vi-VN')} VND, hiện có ${currentBalance.toLocaleString('vi-VN')} VND`,
            code: 'INSUFFICIENT_BALANCE',
          },
        });
      }
      
      // Trừ tiền từ wallet
      const newBalance = currentBalance - amount;
      await User.updateOne(
        { uid: userId },
        { 
          $inc: { walletBalance: -amount },
          $set: { updatedAt: new Date() },
        }
      );
      console.log(`[API] POST /shopee/check-phone - Deducted ${amount} VND, New Balance: ${newBalance} VND`);
      
      // Lưu lịch sử sử dụng
      const usageHistory = await UsageHistory.create({
        userId,
        service: "Check Số Điện Thoại Shopee",
        amount: -amount, // Số âm vì là chi tiêu
        balanceAfter: newBalance,
        metadata: {
          phone: result.phone,
          exists: result.exists,
          errorCode: result.errorCode,
          message: result.message,
        },
      });
      console.log(`[API] POST /shopee/check-phone - Saved usage history: ${usageHistory._id}`);
      
      // Trả về kết quả kèm thông tin giá
      res.json({ 
        success: true, 
        data: {
          ...result,
          amount, // Giá đã tính
          balanceAfter: newBalance, // Số dư sau khi trừ
        },
      });
    } catch (error) {
      console.error(`[API] POST /shopee/check-phone - Error: ${error.message}`, error);
      res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi kiểm tra số điện thoại" },
      });
    }
  }),
);

// GET /shopee/check-phone/history - Lấy lịch sử check số điện thoại
router.get(
  "/check-phone/history",
  authenticate,
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
      // Lấy lịch sử check phone từ UsageHistory
      const query = {
        userId,
        service: "Check Số Điện Thoại Shopee",
      };

      const [history, total] = await Promise.all([
        UsageHistory.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        UsageHistory.countDocuments(query),
      ]);

      // Format dữ liệu để trả về
      const formattedHistory = history.map((item) => ({
        _id: item._id,
        phone: item.metadata?.phone || "N/A",
        exists: item.metadata?.exists,
        amount: Math.abs(item.amount), // Số tiền đã trừ (chuyển từ số âm sang dương)
        balanceAfter: item.balanceAfter,
        createdAt: item.createdAt,
        message: item.metadata?.message,
        errorCode: item.metadata?.errorCode,
      }));

      res.json({
        success: true,
        data: {
          history: formattedHistory,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error(`[API] GET /shopee/check-phone/history - Error: ${error.message}`, error);
      res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi lấy lịch sử check số điện thoại" },
      });
    }
  }),
);

module.exports = router;


