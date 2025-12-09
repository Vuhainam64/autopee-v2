/**
 * Order Service
 * Business logic for order operations (Shopee orders)
 */

const { db } = require('../config')
const { NotFoundError, ValidationError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Order data
 * @throws {NotFoundError} If order not found
 */
const getOrder = async (orderId, userId) => {
  try {
    const orderRef = db.collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      throw new NotFoundError('Order')
    }

    const orderData = orderDoc.data()

    // Verify ownership
    if (orderData.userId !== userId) {
      throw new Error('Unauthorized access to order')
    }

    return {
      id: orderDoc.id,
      ...orderData,
    }
  } catch (error) {
    logger.error('Failed to get order', error, { orderId, userId })
    throw error
  }
}

/**
 * Create new order
 * @param {object} orderData - Order data
 * @param {string} userId - User ID
 * @returns {Promise<object>} Created order
 */
const createOrder = async (orderData, userId) => {
  try {
    const ordersRef = db.collection('orders')
    const newOrder = {
      ...orderData,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await ordersRef.add(newOrder)

    return {
      id: docRef.id,
      ...newOrder,
    }
  } catch (error) {
    logger.error('Failed to create order', error, { userId })
    throw error
  }
}

module.exports = {
  getOrder,
  createOrder,
}

