// Simple async error wrapper and global error handler

const { logError } = require("./logger");
const { getErrorCode, getErrorMessage } = require("../utils/errorCodes");

const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  
  // Xác định errorCode và traceId
  const errorCode = getErrorCode(err);
  const traceId = await logError(err, req, {
    statusCode: res.statusCode || err.statusCode || 500,
    errorCode,
  });
  
  // Status code từ error hoặc default 500
  const statusCode = err.statusCode || 500;
  
  // Response an toàn: chỉ trả errorCode + traceId, KHÔNG trả message thật
  res.status(statusCode).json({
    success: false,
    errorCode,
    traceId: traceId || req.traceId || null,
    error: {
      message: getErrorMessage(errorCode),
    },
  });
};

module.exports = { handleAsync, errorHandler };


