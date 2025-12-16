const logger = require("firebase-functions/logger");

const info = (message, context = {}) => {
  logger.info(message, {structuredData: true, ...context});
};

const error = (message, err, context = {}) => {
  logger.error(message, {
    structuredData: true,
    error: err?.message || err,
    stack: err?.stack,
    ...context,
  });
};

const warn = (message, context = {}) => {
  logger.warn(message, {structuredData: true, ...context});
};

const debug = (message, context = {}) => {
  logger.debug(message, {structuredData: true, ...context});
};

module.exports = {info, error, warn, debug};

