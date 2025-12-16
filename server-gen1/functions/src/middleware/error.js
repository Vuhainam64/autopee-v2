const logger = require("firebase-functions/logger");
const {formatError} = require("../utils/errors");

/**
 * Wrap async handlers to catch errors
 */
const handleAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Central error handler
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error("HTTP handler error", err, {
    path: req.path,
    method: req.method,
  });

  const status = err.statusCode || err.status || 500;
  res.status(status).json(formatError(err));
};

module.exports = {handleAsync, errorHandler};

