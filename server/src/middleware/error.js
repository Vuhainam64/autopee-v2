// Simple async error wrapper and global error handler

const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  const message = err?.message || "Internal server error";
  res.status(500).json({
    success: false,
    error: { message },
  });
};

module.exports = { handleAsync, errorHandler };


