const express = require('express');
const { authenticate } = require('../middleware/auth');
const { handleAsync } = require('../middleware/error');
const AccountCollection = require('../models/AccountCollection');
const ShopeeAccount = require('../models/ShopeeAccount');
const { getAccountInfo } = require('../services/shopeeService');
const { convertSpcFToSpcSt } = require('../services/cookieConverter');
const proxyService = require('../services/proxyService');

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticate);

// ========== COLLECTIONS ==========

// GET /account/collections - Lấy danh sách collections
router.get(
  '/collections',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const collections = await AccountCollection.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: collections,
    });
  })
);

// POST /account/collections - Tạo collection mới
router.post(
  '/collections',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tên collection là bắt buộc' },
      });
    }
    
    const collection = await AccountCollection.create({
      userId,
      name,
      description: description || '',
      accountCount: 0,
    });
    
    res.json({
      success: true,
      data: collection,
    });
  })
);

// PUT /account/collections/:id - Cập nhật collection
router.put(
  '/collections/:id',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { id } = req.params;
    const { name, description } = req.body;
    
    const collection = await AccountCollection.findOneAndUpdate(
      { _id: id, userId },
      { name, description },
      { new: true }
    );
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy collection' },
      });
    }
    
    res.json({
      success: true,
      data: collection,
    });
  })
);

// DELETE /account/collections/:id - Xóa collection
router.delete(
  '/collections/:id',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { id } = req.params;
    
    // Xóa tất cả accounts trong collection
    await ShopeeAccount.deleteMany({ collectionId: id, userId });
    
    // Xóa collection
    const collection = await AccountCollection.findOneAndDelete({
      _id: id,
      userId,
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy collection' },
      });
    }
    
    res.json({
      success: true,
      message: 'Đã xóa collection và tất cả accounts',
    });
  })
);

// ========== ACCOUNTS ==========

// GET /account/collections/:collectionId/accounts - Lấy danh sách accounts trong collection
router.get(
  '/collections/:collectionId/accounts',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { collectionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Kiểm tra collection thuộc về user
    const collection = await AccountCollection.findOne({
      _id: collectionId,
      userId,
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy collection' },
      });
    }
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const [accounts, total] = await Promise.all([
      ShopeeAccount.find({ collectionId, userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ShopeeAccount.countDocuments({ collectionId, userId }),
    ]);
    
    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  })
);

// POST /account/collections/:collectionId/accounts/import - Import cookies
router.post(
  '/collections/:collectionId/accounts/import',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { collectionId } = req.params;
    const { cookies, importType = 'textarea' } = req.body; // importType: 'textarea' | 'file'
    
    // Kiểm tra collection thuộc về user
    const collection = await AccountCollection.findOne({
      _id: collectionId,
      userId,
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy collection' },
      });
    }
    
    if (!cookies || (Array.isArray(cookies) && cookies.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vui lòng cung cấp cookies' },
      });
    }
    
    // Parse cookies từ textarea hoặc array
    let cookieLines = [];
    if (typeof cookies === 'string') {
      cookieLines = cookies.split('\n').map(line => line.trim()).filter(Boolean);
    } else if (Array.isArray(cookies)) {
      cookieLines = cookies;
    }
    
    if (cookieLines.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Không tìm thấy cookie nào' },
      });
    }
    
    // Lấy proxy cho API này nếu có cấu hình
    const proxyInfo = await proxyService.getProxyForApi('/account/getAccountInfo');
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < cookieLines.length; i++) {
      const cookieLine = cookieLines[i];
      
      try {
        // Parse cookie line
        // Định dạng có thể là:
        // 1. phone|password|spc_f (để convert)
        // 2. SPC_F=xxx (chỉ có SPC_F, không convert được)
        // 3. full cookie string (SPC_ST=xxx; SPC_F=xxx; ...)
        let cookieFull = cookieLine;
        let spcF = '';
        let phone = null;
        let password = null;
        
        // Kiểm tra định dạng: phone|password|spc_f
        const parts = cookieLine.split('|').map(p => p.trim());
        if (parts.length === 3) {
          // Định dạng: phone|password|spc_f
          phone = parts[0];
          password = parts[1];
          spcF = parts[2];
          
          // Remove SPC_F= prefix nếu có
          if (spcF.startsWith('SPC_F=')) {
            spcF = spcF.substring(6);
          }
          
          // Convert SPC_F sang full cookie với phone/password
          const convertResult = await convertSpcFToSpcSt(spcF, phone, password, proxyInfo);
          if (convertResult.success) {
            cookieFull = convertResult.cookieFull;
          } else {
            errors.push({
              line: i + 1,
              cookie: `${phone}|***|${spcF.substring(0, 20)}...`,
              error: `Không thể convert SPC_F: ${convertResult.error}`,
            });
            continue;
          }
        } else {
          // Định dạng khác: SPC_F=xxx hoặc full cookie
          const spcFMatch = cookieLine.match(/SPC_F=([^;]+)/);
          if (spcFMatch) {
            spcF = spcFMatch[1];
          }
          
          // Nếu chỉ có SPC_F (không có phone/password), không thể convert
          if (cookieLine.startsWith('SPC_F=') || (cookieLine.match(/^SPC_F=/) && !cookieLine.includes('SPC_ST'))) {
            errors.push({
              line: i + 1,
              cookie: cookieLine.substring(0, 50) + '...',
              error: 'Định dạng không hợp lệ. Vui lòng nhập: phone|password|spc_f hoặc full cookie string',
            });
            continue;
          }
          
          // Nếu là full cookie string, sử dụng trực tiếp
          cookieFull = cookieLine;
        }
        
        // Lấy thông tin tài khoản
        const accountInfo = await getAccountInfo(cookieFull, proxyInfo);
        
        if (accountInfo.error !== 0 || !accountInfo.data) {
          errors.push({
            line: i + 1,
            cookie: cookieLine.substring(0, 50) + '...',
            error: accountInfo.error_msg || 'Không thể lấy thông tin tài khoản',
          });
          continue;
        }
        
        const data = accountInfo.data;
        
        // Kiểm tra account đã tồn tại chưa (theo userid)
        const existingAccount = await ShopeeAccount.findOne({
          collectionId,
          userid: data.userid,
        });
        
        if (existingAccount) {
          // Cập nhật account hiện có
          existingAccount.username = data.username || '';
          existingAccount.email = data.email || '';
          existingAccount.phone = data.phone || '';
          existingAccount.nickname = data.nickname || '';
          existingAccount.shopid = data.shopid;
          existingAccount.isSeller = data.is_seller || false;
          existingAccount.phoneVerified = data.phone_verified || false;
          existingAccount.emailVerified = data.email_verified || false;
          existingAccount.spcF = spcF;
          existingAccount.cookieFull = cookieFull;
          existingAccount.spcSt = cookieFull.match(/SPC_ST=([^;]+)/)?.[1] || '';
          // Lưu password nếu có
          if (password) {
            existingAccount.password = password;
          }
          existingAccount.accountInfo = data;
          existingAccount.lastCheckedAt = new Date();
          await existingAccount.save();
          
          results.push({
            action: 'updated',
            account: existingAccount,
          });
        } else {
          // Tạo account mới
          const newAccount = await ShopeeAccount.create({
            collectionId,
            userId,
            userid: data.userid,
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            nickname: data.nickname || '',
            shopid: data.shopid,
            isSeller: data.is_seller || false,
            phoneVerified: data.phone_verified || false,
            emailVerified: data.email_verified || false,
            spcF: spcF,
            cookieFull: cookieFull,
            spcSt: cookieFull.match(/SPC_ST=([^;]+)/)?.[1] || '',
            password: password || '',
            accountInfo: data,
            lastCheckedAt: new Date(),
          });
          
          results.push({
            action: 'created',
            account: newAccount,
          });
        }
      } catch (error) {
        errors.push({
          line: i + 1,
          cookie: cookieLine.substring(0, 50) + '...',
          error: error.message || 'Lỗi không xác định',
        });
      }
    }
    
    // Cập nhật accountCount trong collection
    const accountCount = await ShopeeAccount.countDocuments({ collectionId });
    await AccountCollection.findByIdAndUpdate(collectionId, { accountCount });
    
    res.json({
      success: true,
      data: {
        imported: results.length,
        errors: errors.length,
        results: results.map(r => ({
          action: r.action,
          username: r.account.username,
          email: r.account.email,
        })),
        errors: errors,
      },
    });
  })
);

// PUT /account/collections/:collectionId/accounts/:accountId - Cập nhật account
router.put(
  '/collections/:collectionId/accounts/:accountId',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { collectionId, accountId } = req.params;

    const account = await ShopeeAccount.findOne({
      _id: accountId,
      collectionId,
      userId,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy account hoặc bạn không có quyền cập nhật' },
      });
    }

    const allowedFields = [
      'username',
      'email',
      'phone',
      'nickname',
      'spcF',
      'spcSt',
      'cookieFull',
      'password',
      'accountInfo',
      'isSeller',
      'phoneVerified',
      'emailVerified',
      'shopid',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        account[field] = req.body[field];
      }
    });

    account.lastCheckedAt = new Date();
    await account.save();

    res.json({
      success: true,
      data: account,
    });
  })
);

// DELETE /account/collections/:collectionId/accounts/:accountId - Xóa account
router.delete(
  '/collections/:collectionId/accounts/:accountId',
  handleAsync(async (req, res) => {
    const userId = req.user.uid;
    const { collectionId, accountId } = req.params;
    
    const account = await ShopeeAccount.findOneAndDelete({
      _id: accountId,
      collectionId,
      userId,
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy account' },
      });
    }
    
    // Cập nhật accountCount trong collection
    const accountCount = await ShopeeAccount.countDocuments({ collectionId });
    await AccountCollection.findByIdAndUpdate(collectionId, { accountCount });
    
    res.json({
      success: true,
      message: 'Đã xóa account',
    });
  })
);

module.exports = router;

