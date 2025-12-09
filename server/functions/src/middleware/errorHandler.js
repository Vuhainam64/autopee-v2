/**
 * Error Handling Middleware
 * Centralized error handling for all functions
 */

const { formatError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Error handler wrapper for HTTP functions
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler with error handling
 */
const handleHTTPErrors = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      logger.error('HTTP handler error', error, {
        path: req.path,
        method: req.method,
      })

      const formattedError = formatError(error)
      const statusCode = error.statusCode || 500

      res.status(statusCode).json(formattedError)
    }
  }
}

/**
 * Error handler wrapper for Callable functions
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler with error handling
 */
const handleCallableErrors = (handler) => {
  return async (data, context) => {
    try {
      return await handler(data, context)
    } catch (error) {
      logger.error('Callable handler error', error, {
        uid: context.auth?.uid,
      })

      throw formatError(error).error
    }
  }
}

module.exports = {
  handleHTTPErrors,
  handleCallableErrors,
}

