/**
 * Shopee API Service
 * Handles Shopee-related API calls
 */

import { post } from './api.js'

/**
 * Get order details for multiple cookies
 * @param {Array<string>} cookies - Array of Shopee cookies
 * @returns {Promise<object>} Order details for each cookie
 */
export const getOrderDetailsForCookie = async (cookies) => {
  return await post('/getOrderDetailsForCookie', { cookies })
}

/**
 * Get checkout detail by checkout_id
 */
export const getCheckoutDetail = async ({ cookie, checkoutId }) => {
  return await post('/getCheckoutDetail', { cookie, checkout_id: checkoutId })
}

/**
 * Get cancel detail by order_id
 */
export const getCancelDetail = async ({ cookie, orderId }) => {
  return await post('/getCancelDetail', { cookie, order_id: orderId })
}

/**
 * Get cancelled order detail (order detail v2 for cancelled)
 */
export const getCancelledOrderDetail = async ({ cookie, orderId }) => {
  return await post('/getCancelledOrderDetail', { cookie, order_id: orderId })
}

