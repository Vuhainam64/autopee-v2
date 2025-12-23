const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Local routes & middlewares
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const shopeeRoutes = require("./routes/shopee");
const adminRoutes = require("./routes/admin");
const webhookRoutes = require("./routes/webhooks");
const paymentRoutes = require("./routes/payment");
const trackingRoutes = require("./routes/tracking");
const proxyRoutes = require("./routes/proxy");
const { authenticate } = require("./middleware/auth");
const { handleAsync, errorHandler } = require("./middleware/error");
const { requestLogger } = require("./middleware/logger");

// New Mongo-based services
const {
  createOrUpdateSession,
} = require("./services/sessionService.mongo");

const app = express();

// Trust proxy để lấy IP thực tế từ x-forwarded-for header
// Cần thiết khi chạy sau proxy/load balancer (production)
app.set('trust proxy', true);

// Global middlewares
app.use(cors());
app.use(express.json());

// Request logging middleware (sau khi parse JSON để có req.body)
app.use(requestLogger);

// Health check
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "autopee-api" });
});

// API routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/shopee", shopeeRoutes);
app.use("/admin", adminRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/payment", paymentRoutes);
app.use("/", trackingRoutes);
app.use("/proxy", proxyRoutes);

// Backward-compatible endpoint for frontend: POST /trackSession
// Equivalent behaviour to POST /user/sessions/track
app.post(
  "/trackSession",
  authenticate,
  handleAsync(async (req, res) => {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, error: { message: "sessionId is required" } });
    }

    let clientIP = "Unknown";
    if (req.headers["x-forwarded-for"]) {
      clientIP = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else if (req.headers["x-real-ip"]) {
      clientIP = req.headers["x-real-ip"];
    } else if (req.ip) {
      clientIP = req.ip;
    } else if (req.socket?.remoteAddress) {
      clientIP = req.socket.remoteAddress;
    }
    if (clientIP && clientIP.startsWith("::ffff:")) {
      clientIP = clientIP.replace("::ffff:", "");
    }

    const userAgent = req.headers["user-agent"] || "Unknown";
    let deviceInfo = "Unknown";
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPhone/.test(userAgent)) deviceInfo = "iPhone";
      else if (/iPad/.test(userAgent)) deviceInfo = "iPad";
      else if (/Android/.test(userAgent)) deviceInfo = "Android";
      else deviceInfo = "Mobile";
    } else if (/Windows/.test(userAgent)) deviceInfo = "Windows";
    else if (/Mac/.test(userAgent)) deviceInfo = "Mac";
    else if (/Linux/.test(userAgent)) deviceInfo = "Linux";
    else deviceInfo = "Desktop";

    await createOrUpdateSession(req.user.uid, sessionId, {
      ipAddress: clientIP,
      userAgent,
      deviceInfo,
    });

    res.json({ success: true, message: "Session tracked successfully" });
  }),
);

// Global error handler (phải đặt cuối cùng)
app.use(errorHandler);

// Initialize DB connection on app bootstrap
connectDB().catch(() => {
  // connectDB already logs & exits on error
});

module.exports = app;


