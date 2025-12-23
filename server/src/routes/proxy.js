const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth.js')
const { handleAsync } = require('../middleware/error.js')
const ProxyKey = require('../models/ProxyKey.js')
const proxyService = require('../services/proxyService.js')

// GET /proxy/keys - Lấy danh sách proxy keys
router.get(
  '/keys',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const keys = await ProxyKey.find({})
        .sort({ createdAt: -1 })
        .lean()

      res.json({
        success: true,
        data: keys,
      })
    } catch (error) {
      console.error('[API] GET /proxy/keys - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi lấy danh sách proxy keys' },
      })
    }
  }),
)

// POST /proxy/keys - Thêm proxy key mới
router.post(
  '/keys',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { key, name, region = 'random', usedByApis = [] } = req.body

      if (!key) {
        return res.status(400).json({
          success: false,
          error: { message: 'Key là bắt buộc' },
        })
      }

      // Kiểm tra key đã tồn tại chưa
      const existing = await ProxyKey.findOne({ key })
      if (existing) {
        return res.status(400).json({
          success: false,
          error: { message: 'Key đã tồn tại' },
        })
      }

      // Lấy proxy mới khi tạo key
      const proxyResult = await proxyService.getNewProxy(key, region)
      
      const proxyKey = new ProxyKey({
        key,
        name: name || key.substring(0, 20),
        region,
        isActive: true,
        usedByApis,
        currentProxy: proxyResult.success ? proxyResult.data : null,
        lastCheckedAt: proxyResult.success ? new Date() : null,
      })

      await proxyKey.save()

      res.json({
        success: true,
        data: proxyKey,
        message: proxyResult.success 
          ? 'Đã thêm proxy key và lấy proxy thành công' 
          : 'Đã thêm proxy key nhưng không thể lấy proxy: ' + proxyResult.error,
      })
    } catch (error) {
      console.error('[API] POST /proxy/keys - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi thêm proxy key' },
      })
    }
  }),
)

// PUT /proxy/keys/:id - Cập nhật proxy key
router.put(
  '/keys/:id',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params
      const { name, region, isActive, usedByApis } = req.body

      const proxyKey = await ProxyKey.findById(id)
      if (!proxyKey) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy proxy key' },
        })
      }

      if (name !== undefined) proxyKey.name = name
      if (region !== undefined) proxyKey.region = region
      if (isActive !== undefined) proxyKey.isActive = isActive
      if (usedByApis !== undefined) proxyKey.usedByApis = usedByApis

      await proxyKey.save()

      res.json({
        success: true,
        data: proxyKey,
        message: 'Đã cập nhật proxy key',
      })
    } catch (error) {
      console.error('[API] PUT /proxy/keys/:id - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi cập nhật proxy key' },
      })
    }
  }),
)

// DELETE /proxy/keys/:id - Xóa proxy key
router.delete(
  '/keys/:id',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params

      // Thoát proxy trước khi xóa
      const proxyKey = await ProxyKey.findById(id)
      if (proxyKey) {
        await proxyService.releaseProxy(proxyKey.key)
      }

      const result = await ProxyKey.findByIdAndDelete(id)

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy proxy key' },
        })
      }

      res.json({
        success: true,
        message: 'Đã xóa proxy key',
      })
    } catch (error) {
      console.error('[API] DELETE /proxy/keys/:id - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi xóa proxy key' },
      })
    }
  }),
)

// POST /proxy/keys/:id/refresh - Lấy proxy mới cho key
router.post(
  '/keys/:id/refresh',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params

      const proxyKey = await ProxyKey.findById(id)
      if (!proxyKey) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy proxy key' },
        })
      }

      const proxyResult = await proxyService.getNewProxy(proxyKey.key, proxyKey.region)

      if (proxyResult.success) {
        proxyKey.currentProxy = proxyResult.data
        proxyKey.lastCheckedAt = new Date()
        await proxyKey.save()

        res.json({
          success: true,
          data: proxyKey,
          message: 'Đã lấy proxy mới thành công',
        })
      } else {
        res.status(400).json({
          success: false,
          error: { message: proxyResult.error || 'Không thể lấy proxy mới' },
          code: proxyResult.code,
        })
      }
    } catch (error) {
      console.error('[API] POST /proxy/keys/:id/refresh - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi lấy proxy mới' },
      })
    }
  }),
)

// POST /proxy/keys/:id/check - Kiểm tra proxy hiện tại
router.post(
  '/keys/:id/check',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params

      const proxyKey = await ProxyKey.findById(id)
      if (!proxyKey) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy proxy key' },
        })
      }

      const proxyResult = await proxyService.getCurrentProxy(proxyKey.key)

      if (proxyResult.success) {
        proxyKey.currentProxy = proxyResult.data
        proxyKey.lastCheckedAt = new Date()
        await proxyKey.save()

        res.json({
          success: true,
          data: proxyKey,
          message: 'Đã cập nhật thông tin proxy',
        })
      } else {
        res.status(400).json({
          success: false,
          error: { message: proxyResult.error || 'Không thể lấy thông tin proxy' },
          code: proxyResult.code,
        })
      }
    } catch (error) {
      console.error('[API] POST /proxy/keys/:id/check - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi kiểm tra proxy' },
      })
    }
  }),
)

// POST /proxy/keys/:id/release - Thoát proxy
router.post(
  '/keys/:id/release',
  authenticate,
  handleAsync(async (req, res) => {
    try {
      const { id } = req.params

      const proxyKey = await ProxyKey.findById(id)
      if (!proxyKey) {
        return res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy proxy key' },
        })
      }

      const releaseResult = await proxyService.releaseProxy(proxyKey.key)

      if (releaseResult.success) {
        proxyKey.currentProxy = null
        proxyKey.lastCheckedAt = new Date()
        await proxyKey.save()

        res.json({
          success: true,
          data: proxyKey,
          message: 'Đã thoát proxy thành công',
        })
      } else {
        res.status(400).json({
          success: false,
          error: { message: releaseResult.error || 'Không thể thoát proxy' },
          code: releaseResult.code,
        })
      }
    } catch (error) {
      console.error('[API] POST /proxy/keys/:id/release - Error:', error.message)
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Lỗi khi thoát proxy' },
      })
    }
  }),
)

module.exports = router

