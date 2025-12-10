/**
 * Custom Logger Utility
 * Provides structured logging with context
 */

const logger = require("firebase-functions/logger");

/**
 * Log info message with context
 * @param {string} message - Log message
 * @param {object} context - Additional context data
 */
const info = (message, context = {}) => {
  logger.info(message, {structuredData: true, ...context});
};

/**
 * Log error message with context
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {object} context - Additional context data
 */
const error = (message, error, context = {}) => {
  logger.error(message, {
    structuredData: true,
    error: error?.message || error,
    stack: error?.stack,
    ...context,
  });
};

/**
 * Log warning message with context
 * @param {string} message - Warning message
 * @param {object} context - Additional context data
 */
const warn = (message, context = {}) => {
  logger.warn(message, {structuredData: true, ...context});
};

/**
 * Log debug message with context
 * @param {string} message - Debug message
 * @param {object} context - Additional context data
 */
const debug = (message, context = {}) => {
  logger.debug(message, {structuredData: true, ...context});
};

module.exports = {
  info,
  error,
  warn,
  debug,
};

