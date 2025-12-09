/**
 * Authentication Middleware
 * Validates Firebase Auth tokens for HTTP requests and callable functions
 */

const { auth } = require('../config')
const { AuthenticationError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Verify Firebase Auth token from request header
 * @param {object} req - Express request object (for HTTP functions)
 * @returns {Promise<object>} Decoded token with user info
 * @throws {AuthenticationError} If token is invalid
 */
const verifyToken = async (req) => {
  try {
    const authHeader = req.headers?.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header')
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    }
  } catch (error) {
    logger.error('Token verification failed', error)
    throw new AuthenticationError('Invalid or expired token')
  }
}

/**
 * Middleware for HTTP functions
 * Adds user info to request object
 */
const authenticateHTTP = async (req, res, next) => {
  try {
    const user = await verifyToken(req)
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: error.code || 'AUTHENTICATION_ERROR',
        message: error.message,
      },
    })
  }
}

/**
 * Middleware for Callable functions
 * Extracts and verifies user from context
 * @param {object} data - Request data
 * @param {object} context - Firebase Functions context
 * @returns {Promise<object>} User info
 * @throws {AuthenticationError} If not authenticated
 */
const authenticateCallable = async (data, context) => {
  if (!context.auth) {
    throw new AuthenticationError('User must be authenticated')
  }

  return {
    uid: context.auth.uid,
    email: context.auth.token.email,
    emailVerified: context.auth.token.email_verified,
  }
}

module.exports = {
  verifyToken,
  authenticateHTTP,
  authenticateCallable,
}

