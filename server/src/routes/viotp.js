const express = require('express')
const axios = require('axios')
const { authenticate } = require('../middleware/auth')
const { handleAsync } = require('../middleware/error')
const ViotpKey = require('../models/ViotpKey')

const router = express.Router()

router.use(authenticate)

const VIOTP_BASE = 'https://api.viotp.com'

const getUserTokenByKeyId = async (uid, keyId) => {
  const key = await ViotpKey.findOne({ _id: keyId, userId: uid }).lean()
  if (!key) {
    const err = new Error('Key không tồn tại')
    err.statusCode = 404
    throw err
  }
  return key
}

// ===== Key management =====

// GET /viotp/keys
router.get(
  '/keys',
  handleAsync(async (req, res) => {
    const items = await ViotpKey.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: { items } })
  }),
)

// POST /viotp/keys
router.post(
  '/keys',
  handleAsync(async (req, res) => {
    const { name, token } = req.body
    if (!name || !token) {
      return res.status(400).json({
        success: false,
        error: { message: 'name và token là bắt buộc' },
      })
    }

    const created = await ViotpKey.create({
      userId: req.user.uid,
      name,
      token,
    })

    res.json({ success: true, data: created })
  }),
)

// PUT /viotp/keys/:id
router.put(
  '/keys/:id',
  handleAsync(async (req, res) => {
    const { id } = req.params
    const { name, token } = req.body

    const update = {}
    if (name !== undefined) update.name = name
    if (token !== undefined) update.token = token

    const updated = await ViotpKey.findOneAndUpdate(
      { _id: id, userId: req.user.uid },
      { $set: update },
      { new: true },
    ).lean()

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: 'Key không tồn tại' },
      })
    }

    res.json({ success: true, data: updated })
  }),
)

// DELETE /viotp/keys/:id
router.delete(
  '/keys/:id',
  handleAsync(async (req, res) => {
    const { id } = req.params
    const deleted = await ViotpKey.findOneAndDelete({ _id: id, userId: req.user.uid }).lean()
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Key không tồn tại' },
      })
    }
    res.json({ success: true, data: deleted })
  }),
)

// ===== VIOTP proxy endpoints (use saved key) =====

// GET /viotp/networks?keyId=...
router.get(
  '/networks',
  handleAsync(async (req, res) => {
    const { keyId } = req.query
    if (!keyId) {
      return res.status(400).json({ success: false, error: { message: 'keyId là bắt buộc' } })
    }

    const key = await getUserTokenByKeyId(req.user.uid, keyId)
    const url = `${VIOTP_BASE}/networks/get?token=${encodeURIComponent(key.token)}`

    const { data } = await axios.get(url, { timeout: 20000 })

    await ViotpKey.updateOne(
      { _id: key._id },
      { $set: { lastUsedAt: new Date() } },
    )

    res.json({ success: true, data })
  }),
)

// GET /viotp/services?keyId=...&country=vn|la
router.get(
  '/services',
  handleAsync(async (req, res) => {
    const { keyId, country } = req.query
    if (!keyId) {
      return res.status(400).json({ success: false, error: { message: 'keyId là bắt buộc' } })
    }

    const key = await getUserTokenByKeyId(req.user.uid, keyId)

    const params = new URLSearchParams({ token: key.token })
    if (country) params.set('country', country)

    const url = `${VIOTP_BASE}/service/getv2?${params.toString()}`
    const { data } = await axios.get(url, { timeout: 20000 })

    await ViotpKey.updateOne(
      { _id: key._id },
      { $set: { lastUsedAt: new Date() } },
    )

    res.json({ success: true, data })
  }),
)

// POST /viotp/request
// body: { keyId, serviceId, country?, network?, prefix?, exceptPrefix?, number? }
router.post(
  '/request',
  handleAsync(async (req, res) => {
    const { keyId, serviceId, country, network, prefix, exceptPrefix, number } = req.body || {}
    if (!keyId || !serviceId) {
      return res.status(400).json({
        success: false,
        error: { message: 'keyId và serviceId là bắt buộc' },
      })
    }

    const key = await getUserTokenByKeyId(req.user.uid, keyId)

    const params = new URLSearchParams({
      token: key.token,
      serviceId: String(serviceId),
    })

    if (country) params.set('country', country)

    // VIOTP allows network/prefix/exceptPrefix as pipe list
    if (network) {
      // VIOTP expects network as pipe list, e.g. MOBIFONE|VINAPHONE
      // The trailing pipe from client is not needed, remove it if exists
      const formattedNetwork = network.endsWith('|') ? network.slice(0, -1) : network
      params.set('network', formattedNetwork)
    }
    if (prefix) params.set('prefix', prefix)
    if (exceptPrefix) params.set('exceptPrefix', exceptPrefix)
    if (number) params.set('number', number)

    const url = `${VIOTP_BASE}/request/getv2?${params.toString()}`
    const { data } = await axios.get(url, { timeout: 20000 })

    await ViotpKey.updateOne(
      { _id: key._id },
      { $set: { lastUsedAt: new Date() } },
    )

    res.json({ success: true, data })
  }),
)

// GET /viotp/session?keyId=...&requestId=...
router.get(
  '/session',
  handleAsync(async (req, res) => {
    const { keyId, requestId } = req.query
    if (!keyId || !requestId) {
      return res.status(400).json({
        success: false,
        error: { message: 'keyId và requestId là bắt buộc' },
      })
    }

    const key = await getUserTokenByKeyId(req.user.uid, keyId)

    const params = new URLSearchParams({
      token: key.token,
      requestId: String(requestId),
    })

    const url = `${VIOTP_BASE}/session/getv2?${params.toString()}`
    const { data } = await axios.get(url, { timeout: 20000 })

    await ViotpKey.updateOne(
      { _id: key._id },
      { $set: { lastUsedAt: new Date() } },
    )

    res.json({ success: true, data })
  }),
)

// GET /viotp/balance?keyId=...
router.get(
  '/balance',
  handleAsync(async (req, res) => {
    const { keyId } = req.query;
    if (!keyId) {
      return res.status(400).json({ success: false, error: { message: 'keyId là bắt buộc' } });
    }

    const key = await getUserTokenByKeyId(req.user.uid, keyId);

    const url = `${VIOTP_BASE}/users/balance?token=${encodeURIComponent(key.token)}`;

    try {
      const { data } = await axios.get(url, { timeout: 20000 });

      await ViotpKey.updateOne(
        { _id: key._id },
        { $set: { lastUsedAt: new Date() } },
      );

      return res.json({
        success: true,
        data: {
          balance: data?.data?.Balance ?? data?.data?.balance ?? 0,
          raw: data,
        },
      });
    } catch (err) {
      console.error('[VIOTP] balance error:', err.message);
      return res.status(500).json({ success: false, error: { message: 'Lỗi khi lấy số dư VIOTP' } });
    }
  }),
);

module.exports = router

