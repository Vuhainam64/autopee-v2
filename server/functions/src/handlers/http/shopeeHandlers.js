/**
 * HTTP Handlers for Shopee endpoints
 */

const {onRequest} = require("firebase-functions/v2/https");
const {verifyToken, handleHTTPErrors} = require("../../middleware");
const {
  getAllOrderAndCheckout,
  getOrderDetail,
  getOrderDetails,
  getOrderList,
  getCheckoutList,
  getOrderDetailsForCookie,
  fetchOrdersByCookie,
  fetchCheckoutDetail,
  fetchOrderDetailCancelled,
  cancelOrder,
  fetchCancelDetail,
} = require("../../services/shopeeService");
const logger = require("../../utils/logger");

/**
 * Get all orders and checkouts
 * POST /getAllOrderAndCheckout
 */
exports.getAllOrderAndCheckout = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, limit, offset} = req.body;

      if (!cookie) {
        return res.status(400).json({
          success: false,
          error: {message: "Cookie là bắt buộc"},
        });
      }

      const result = await getAllOrderAndCheckout(
          cookie,
          limit || 5,
          offset || 0,
      );

      res.json({success: true, data: result});
    }),
);

/**
 * Get order detail by order_id
 * POST /getOrderDetail
 */
exports.getOrderDetail = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {order_id, cookie} = req.body;

      if (!order_id || !cookie) {
        return res.status(400).json({
          success: false,
          error: {message: "order_id và cookie là bắt buộc"},
        });
      }

      const result = await getOrderDetail(order_id, cookie);

      res.json({success: true, data: result});
    }),
);

/**
 * Get multiple order details
 * POST /getOrderDetails
 */
exports.getOrderDetails = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {order_ids, cookie} = req.body;

      if (!order_ids || !Array.isArray(order_ids) || !cookie) {
        return res.status(400).json({
          success: false,
          error: {message: "order_ids (array) và cookie là bắt buộc"},
        });
      }

      const orderDetails = await getOrderDetails(order_ids, cookie);

      res.json({success: true, data: {orderDetails}});
    }),
);

/**
 * Get order list
 * POST /getOrderList
 */
exports.getOrderList = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, limit, list_type, offset} = req.body;

      if (!cookie) {
        return res.status(400).json({
          success: false,
          error: {message: "Cookie là bắt buộc"},
        });
      }

      const result = await getOrderList(
          cookie,
          limit || 10,
          list_type || 3,
          offset || 0,
      );

      res.json({success: true, data: result});
    }),
);

/**
 * Get checkout list
 * POST /getCheckoutList
 */
exports.getCheckoutList = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, cursor, limit} = req.body;

      if (!cookie) {
        return res.status(400).json({
          success: false,
          error: {message: "Cookie là bắt buộc"},
        });
      }

      const result = await getCheckoutList(
          cookie,
          cursor || 0,
          limit || 10,
      );

      res.json({success: true, data: result});
    }),
);

/**
 * Get order list for multiple cookies (direct Shopee API)
 * POST /getOrderDetailsForCookie
 */
exports.getOrderDetailsForCookie = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookies} = req.body;

      if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
        return res.status(400).json({
          success: false,
          error: {message: "cookies (array) là bắt buộc và phải có ít nhất 1 cookie"},
        });
      }

      logger.info("Processing cookies", {count: cookies.length});

      // Allow override limit/list_type/offset if needed
      const {limit, list_type: listType, offset} = req.body;
      const allOrderDetails = await getOrderDetailsForCookie(cookies, {
        limit,
        listType,
        offset,
      });

      logger.info("Completed processing cookies", {
        resultCount: allOrderDetails.length,
      });

      res.json({success: true, data: {allOrderDetails}});
    }),
);

/**
 * Get order list for a single cookie (direct Shopee API)
 * POST /getOrdersByCookie
 */
exports.getOrdersByCookie = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, limit, list_type: listType, offset} = req.body;

      if (!cookie) {
        return res.status(400).json({
          success: false,
          error: {message: "cookie là bắt buộc"},
        });
      }

      const data = await fetchOrdersByCookie(cookie, {
        limit,
        listType,
        offset,
      });

      res.json({success: true, data});
    }),
);

/**
 * Get checkout detail by checkout_id
 * POST /getCheckoutDetail
 */
exports.getCheckoutDetail = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, checkout_id: checkoutId} = req.body;

      if (!cookie || !checkoutId) {
        return res.status(400).json({
          success: false,
          error: {message: "cookie và checkout_id là bắt buộc"},
        });
      }

      const data = await fetchCheckoutDetail(cookie, checkoutId);

      res.json({success: true, data});
    }),
);

/**
 * Get cancelled order detail by order_id
 * POST /getCancelledOrderDetail
 */
exports.getCancelledOrderDetail = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, order_id: orderId} = req.body;

      if (!cookie || !orderId) {
        return res.status(400).json({
          success: false,
          error: {message: "cookie và order_id là bắt buộc"},
        });
      }

      const data = await fetchOrderDetailCancelled(cookie, orderId);

      res.json({success: true, data});
    }),
);

/**
 * Cancel order by order_id
 * POST /cancelOrder
 */
exports.cancelOrder = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, order_id: orderId, cancel_reason_code: cancelReasonCode} = req.body;

      if (!cookie || !orderId) {
        return res.status(400).json({
          success: false,
          error: {message: "cookie và order_id là bắt buộc"},
        });
      }

      const data = await cancelOrder(cookie, orderId, cancelReasonCode || 3);

      res.json({success: true, data});
    }),
);

/**
 * Get cancel detail by order_id
 * POST /getCancelDetail
 */
exports.getCancelDetail = onRequest(
    {cors: true},
    handleHTTPErrors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: {message: "Method not allowed"},
        });
      }

      await verifyToken(req); // Require authentication

      const {cookie, order_id: orderId} = req.body;

      if (!cookie || !orderId) {
        return res.status(400).json({
          success: false,
          error: {message: "cookie và order_id là bắt buộc"},
        });
      }

      const data = await fetchCancelDetail(cookie, orderId);

      res.json({success: true, data});
    }),
);

