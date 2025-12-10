/**
 * Firebase Cloud Functions - Main Entry Point
 *
 * This file exports all Cloud Functions organized by type:
 * - HTTP Functions: REST API endpoints
 * - Callable Functions: Client SDK callable functions
 * - Triggers: Firestore, Auth, Storage triggers
 */

const {setGlobalOptions} = require("firebase-functions/v2");

// Global configuration for all functions
// Optimized for student projects - minimal cost
setGlobalOptions({
  maxInstances: 2, // Reduced from 10 - enough for student projects
  // minInstances removed to avoid minimum cost (pay-as-you-go only)
  region: "asia-southeast1", // Singapore region for better latency in Vietnam
  memory: "128MiB", // Reduced from 256MiB - sufficient for most use cases, cheaper
});

// HTTP Functions - User
const httpHandlers = require("./src/handlers/http/userHandlers");
exports.getCurrentUser = httpHandlers.getCurrentUser;
exports.updateCurrentUser = httpHandlers.updateCurrentUser;
exports.getUserSessions = httpHandlers.getUserSessions;
exports.revokeSession = httpHandlers.revokeSession;
exports.revokeAllOtherSessions = httpHandlers.revokeAllOtherSessions;
exports.trackSession = httpHandlers.trackSession;

// HTTP Functions - Shopee
const shopeeHandlers = require("./src/handlers/http/shopeeHandlers");
exports.getAllOrderAndCheckout = shopeeHandlers.getAllOrderAndCheckout;
exports.getOrderDetail = shopeeHandlers.getOrderDetail;
exports.getOrderDetails = shopeeHandlers.getOrderDetails;
exports.getOrderList = shopeeHandlers.getOrderList;
exports.getCheckoutList = shopeeHandlers.getCheckoutList;
exports.getOrderDetailsForCookie = shopeeHandlers.getOrderDetailsForCookie;
exports.getOrdersByCookie = shopeeHandlers.getOrdersByCookie;
exports.getCheckoutDetail = shopeeHandlers.getCheckoutDetail;
exports.getCancelledOrderDetail = shopeeHandlers.getCancelledOrderDetail;
exports.cancelOrder = shopeeHandlers.cancelOrder;
exports.getCancelDetail = shopeeHandlers.getCancelDetail;

// Callable Functions
const callableHandlers = require("./src/handlers/callable/userCallable");
exports.getUserProfile = callableHandlers.getUserProfile;
exports.updateUserProfile = callableHandlers.updateUserProfile;

// Firestore Triggers
// Temporarily disabled - will enable after Eventarc permissions are set up
// Wait 5-10 minutes after first 2nd gen function deployment, then retry
// const firestoreTriggers = require("./src/handlers/triggers/firestoreTriggers");
// exports.onUserCreate = firestoreTriggers.onUserCreate;
// exports.onUserUpdate = firestoreTriggers.onUserUpdate;
