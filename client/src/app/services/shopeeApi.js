import { post, get } from './api.js'

// Get orders + checkouts via backend proxy
export const getAllOrdersAndCheckouts = async ({ cookie, limit = 10, list_type = 7, offset = 0 }) => {
  return await post('/shopee/orders', { cookie, limit, list_type, offset })
}

// Get order detail v2 (to enrich tracking, address, etc.)
export const getOrderDetail = async ({ cookie, orderId }) => {
  return await post('/shopee/order-detail', { cookie, order_id: orderId })
}

// QR: generate, status, login
export const genShopeeQR = async () => get('/shopee/qr')
export const checkShopeeQR = async (qrcode_id) =>
  get(`/shopee/qr/status?qrcode_id=${encodeURIComponent(qrcode_id)}&_t=${Date.now()}`)
export const loginShopeeQR = async (qrcode_token) => post('/shopee/qr/login', { qrcode_token })

