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
  deleteCookie,
  deleteCookieByString,
} = require("../services/cookieService");
const User = require("../models/User");
const UsageHistory = require("../models/UsageHistory");
const ShopeeVoucher = require("../models/ShopeeVoucher");
const FreeshipShopee = require("../models/FreeshipShopee");
const axios = require("axios");

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
      
      // Nếu cookie không hợp lệ (403), xóa cookie khỏi database
      if (result.invalidCookie) {
        if (cookieDoc && cookieDoc._id) {
          const deleted = await deleteCookie(cookieDoc._id, userId);
          if (deleted) {
            console.log(`[API] POST /shopee/check-phone - Deleted invalid cookie: ${cookieDoc._id}`);
          }
        } else if (cookieToUse) {
          // Nếu cookie từ body, tìm và xóa theo cookie string
          const deleted = await deleteCookieByString(cookieToUse, userId);
          if (deleted) {
            console.log(`[API] POST /shopee/check-phone - Deleted invalid cookie by string`);
          }
        }
      }
      
      // Tính giá dựa trên kết quả
      // 10 VND nếu đã tồn tại (thành công), 100 VND nếu chưa tồn tại (thất bại)
      const amount = result.exists ? 10 : 100;
      
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

// POST /shopee/save-voucher - Lưu voucher Shopee vào database
router.post(
  "/save-voucher",
  handleAsync(async (req, res) => {
    const { cookie, voucher_promotionid, signature, voucher_code } = req.body;

    if (!cookie || !voucher_promotionid || !signature || !voucher_code) {
      return res.status(400).json({
        success: false,
        error: { message: "cookie, voucher_promotionid, signature, và voucher_code là bắt buộc" },
      });
    }

    try {
      // Gọi API Shopee để lưu voucher
      const url = "https://mall.shopee.vn/api/v2/voucher_wallet/save_vouchers";
      const headers = {
        'Cookie': cookie,
        'Content-Type': 'application/json'
      };
      const payload = {
        "voucher_identifiers": [
          {
            "promotion_id": parseInt(voucher_promotionid),
            "voucher_code": voucher_code,
            "signature": signature,
            "signature_source": 0
          }
        ],
        "need_user_voucher_status": true
      };

      const response = await axios.post(url, payload, { headers });

      if (response.status >= 200 && response.status < 300) {
        const shopeeResponse = response.data;

        // Trả về error và error_msg từ response của Shopee
        if (shopeeResponse.responses && shopeeResponse.responses.length > 0) {
          const firstResponse = shopeeResponse.responses[0];
          
          // Nếu lưu thành công (error === 0), lưu vào database
          if (firstResponse.error === 0 && shopeeResponse.data && shopeeResponse.data.voucher_basic_info) {
            const voucherInfo = shopeeResponse.data.voucher_basic_info;
            
            // Xác định loại: freeship nếu iconText === 'FREESHIP' hoặc voucherMarketType === 2
            const isFreeship = voucherInfo.icon_text === 'FREESHIP' || voucherInfo.voucher_market_type === 2;
            const Model = isFreeship ? FreeshipShopee : ShopeeVoucher;
            
            // Lưu hoặc cập nhật voucher/freeship vào database
            await Model.findOneAndUpdate(
              {
                promotionId: parseInt(voucher_promotionid),
                voucherCode: voucher_code,
              },
              {
                promotionId: parseInt(voucher_promotionid),
                voucherCode: voucher_code,
                signature: signature,
                voucherName: voucherInfo.title || voucher_code,
                description: shopeeResponse.data.voucher_usage_term?.description || '',
                discountValue: voucherInfo.discount_value || 0,
                discountPercentage: voucherInfo.discount_percentage || 0,
                discountCap: voucherInfo.discount_cap || 0,
                minSpend: voucherInfo.min_spend || 0,
                rewardValue: voucherInfo.reward_value || 0,
                rewardPercentage: voucherInfo.reward_percentage || 0,
                rewardType: voucherInfo.reward_type || 0,
                startTime: voucherInfo.start_time || 0,
                endTime: voucherInfo.end_time || 0,
                claimStartTime: voucherInfo.claim_start_time || 0,
                claimEndTime: voucherInfo.claim_end_time || 0,
                hasExpired: voucherInfo.has_expired || false,
                disabled: voucherInfo.disabled || false,
                fullyRedeemed: voucherInfo.fully_redeemed || false,
                fullyClaimed: voucherInfo.fully_claimed || false,
                fullyUsed: voucherInfo.fully_used || false,
                newUserOnly: voucherInfo.new_user_only || false,
                shopeeWalletOnly: voucherInfo.shopee_wallet_only || false,
                productLimit: voucherInfo.product_limit || false,
                usageLimit: voucherInfo.usage_limit || null,
                usedCount: voucherInfo.used_count || 0,
                leftCount: voucherInfo.left_count || null,
                voucherMarketType: voucherInfo.voucher_market_type || 1,
                useType: voucherInfo.use_type || 0,
                iconText: voucherInfo.icon_text || '',
                iconHash: voucherInfo.icon_hash || '',
                customisedLabels: (voucherInfo.customised_labels || []).map(label => label.content || label),
                brandingColor: voucherInfo.branding_color || '#EE4D2D',
                customerReferenceId: voucherInfo.customer_reference_id || null,
                shopId: voucherInfo.shop_id || 0,
                shopName: voucherInfo.shop_name || null,
                rawData: shopeeResponse.data,
              },
              {
                upsert: true,
                new: true,
              }
            );
          }

          return res.json({
            success: true,
            data: firstResponse,
          });
        } else {
          return res.json({
            success: true,
            data: {
              error: shopeeResponse.error || 0,
              error_msg: shopeeResponse.error_msg || null,
            },
          });
        }
      } else {
        return res.status(response.status).json({
          success: false,
          error: { message: `API Shopee trả về mã lỗi: ${response.status}` },
        });
      }
    } catch (error) {
      console.error("[API] POST /shopee/save-voucher - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi lưu voucher" },
      });
    }
  }),
);

// POST /shopee/vouchers - Thêm voucher trực tiếp vào database (không cần cookie Shopee)
router.post(
  "/vouchers",
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const {
        promotionId,
        voucherCode,
        signature,
        voucherName,
        description,
        discountValue,
        discountPercentage,
        discountCap,
        minSpend,
        rewardValue,
        rewardPercentage,
        rewardType,
        startTime,
        endTime,
        claimStartTime,
        claimEndTime,
        hasExpired,
        disabled,
        newUserOnly,
        shopeeWalletOnly,
        productLimit,
        usageLimit,
        voucherMarketType,
        useType,
        iconText,
        iconHash,
        customisedLabels,
        brandingColor,
        customerReferenceId,
        shopId,
        shopName,
        rawData,
      } = req.body;

      if (!promotionId || !voucherCode || !signature) {
        return res.status(400).json({
          success: false,
          error: { message: "promotionId, voucherCode, và signature là bắt buộc" },
        });
      }

      // Lưu hoặc cập nhật voucher vào database
      const voucher = await ShopeeVoucher.findOneAndUpdate(
        {
          promotionId: parseInt(promotionId),
          voucherCode: voucherCode,
        },
        {
          promotionId: parseInt(promotionId),
          voucherCode: voucherCode,
          signature: signature,
          voucherName: voucherName || voucherCode,
          description: description || '',
          discountValue: discountValue || 0,
          discountPercentage: discountPercentage || 0,
          discountCap: discountCap || 0,
          minSpend: minSpend || 0,
          rewardValue: rewardValue || 0,
          rewardPercentage: rewardPercentage || 0,
          rewardType: rewardType || 0,
          startTime: startTime || 0,
          endTime: endTime || 0,
          claimStartTime: claimStartTime || 0,
          claimEndTime: claimEndTime || 0,
          hasExpired: hasExpired || false,
          disabled: disabled || false,
          newUserOnly: newUserOnly || false,
          shopeeWalletOnly: shopeeWalletOnly || false,
          productLimit: productLimit || false,
          usageLimit: usageLimit || null,
          voucherMarketType: voucherMarketType || 1,
          useType: useType || 0,
          iconText: iconText || '',
          iconHash: iconHash || '',
          customisedLabels: customisedLabels || [],
          brandingColor: brandingColor || '#EE4D2D',
          customerReferenceId: customerReferenceId || null,
          shopId: shopId || 0,
          shopName: shopName || null,
          rawData: rawData || {},
        },
        {
          upsert: true,
          new: true,
        }
      );

      res.json({
        success: true,
        data: voucher,
        message: "Đã lưu voucher vào database",
      });
    } catch (error) {
      console.error("[API] POST /shopee/vouchers - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi lưu voucher" },
      });
    }
  }),
);

// DELETE /shopee/vouchers/:id - Xóa voucher khỏi database
router.delete(
  "/vouchers/:id",
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params;

      const result = await ShopeeVoucher.findByIdAndDelete(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: "Không tìm thấy voucher" },
        });
      }

      res.json({
        success: true,
        message: "Đã xóa voucher",
      });
    } catch (error) {
      console.error("[API] DELETE /shopee/vouchers/:id - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi xóa voucher" },
      });
    }
  }),
);

// GET /shopee/vouchers - Lấy danh sách voucher từ database
router.get(
  "/vouchers",
  handleAsync(async (req, res) => {
    try {
      const { expired, disabled, limit = 100 } = req.query;
      
      const query = {};
      if (expired !== undefined) {
        query.hasExpired = expired === 'true';
      }
      if (disabled !== undefined) {
        query.disabled = disabled === 'true';
      }

      const vouchers = await ShopeeVoucher.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: vouchers,
      });
    } catch (error) {
      console.error("[API] GET /shopee/vouchers - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi lấy danh sách voucher" },
      });
    }
  }),
);

// GET /shopee/freeships - Lấy danh sách freeship từ database
router.get(
  "/freeships",
  handleAsync(async (req, res) => {
    try {
      const { expired, disabled, limit = 100 } = req.query;
      
      const query = {};
      if (expired !== undefined) {
        query.hasExpired = expired === 'true';
      }
      if (disabled !== undefined) {
        query.disabled = disabled === 'true';
      }

      const freeships = await FreeshipShopee.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: freeships,
      });
    } catch (error) {
      console.error("[API] GET /shopee/freeships - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi lấy danh sách freeship" },
      });
    }
  }),
);

// POST /shopee/freeships - Thêm freeship trực tiếp vào database (không cần cookie Shopee)
router.post(
  "/freeships",
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const {
        promotionId,
        voucherCode,
        signature,
        voucherName,
        description,
        discountValue,
        discountPercentage,
        discountCap,
        minSpend,
        rewardValue,
        rewardPercentage,
        rewardType,
        startTime,
        endTime,
        claimStartTime,
        claimEndTime,
        hasExpired,
        disabled,
        newUserOnly,
        shopeeWalletOnly,
        productLimit,
        usageLimit,
        voucherMarketType,
        useType,
        iconText,
        iconHash,
        customisedLabels,
        brandingColor,
        customerReferenceId,
        shopId,
        shopName,
        rawData,
      } = req.body;

      if (!promotionId || !voucherCode || !signature) {
        return res.status(400).json({
          success: false,
          error: { message: "promotionId, voucherCode, và signature là bắt buộc" },
        });
      }

      // Lưu hoặc cập nhật freeship vào database
      const freeship = await FreeshipShopee.findOneAndUpdate(
        {
          promotionId: parseInt(promotionId),
          voucherCode: voucherCode,
        },
        {
          promotionId: parseInt(promotionId),
          voucherCode: voucherCode,
          signature: signature,
          voucherName: voucherName || voucherCode,
          description: description || '',
          discountValue: discountValue || 0,
          discountPercentage: discountPercentage || 0,
          discountCap: discountCap || 0,
          minSpend: minSpend || 0,
          rewardValue: rewardValue || 0,
          rewardPercentage: rewardPercentage || 0,
          rewardType: rewardType || 0,
          startTime: startTime || 0,
          endTime: endTime || 0,
          claimStartTime: claimStartTime || 0,
          claimEndTime: claimEndTime || 0,
          hasExpired: hasExpired || false,
          disabled: disabled || false,
          newUserOnly: newUserOnly || false,
          shopeeWalletOnly: shopeeWalletOnly || false,
          productLimit: productLimit || false,
          usageLimit: usageLimit || null,
          voucherMarketType: voucherMarketType || 2,
          useType: useType || 0,
          iconText: iconText || 'FREESHIP',
          iconHash: iconHash || '',
          customisedLabels: customisedLabels || [],
          brandingColor: brandingColor || '#EE4D2D',
          customerReferenceId: customerReferenceId || null,
          shopId: shopId || 0,
          shopName: shopName || null,
          rawData: rawData || {},
        },
        {
          upsert: true,
          new: true,
        }
      );

      res.json({
        success: true,
        data: freeship,
        message: "Đã lưu freeship vào database",
      });
    } catch (error) {
      console.error("[API] POST /shopee/freeships - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi lưu freeship" },
      });
    }
  }),
);

// DELETE /shopee/freeships/:id - Xóa freeship khỏi database
router.delete(
  "/freeships/:id",
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params;

      const result = await FreeshipShopee.findByIdAndDelete(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: "Không tìm thấy freeship" },
        });
      }

      res.json({
        success: true,
        message: "Đã xóa freeship",
      });
    } catch (error) {
      console.error("[API] DELETE /shopee/freeships/:id - Error:", error.message);
      return res.status(500).json({
        success: false,
        error: { message: error.message || "Lỗi khi xóa freeship" },
      });
    }
  }),
);

module.exports = router;


