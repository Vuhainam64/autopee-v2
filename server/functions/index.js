/**
 * Firebase Cloud Functions - Main Entry Point
 *
 * This file exports all Cloud Functions organized by type:
 * - HTTP Functions: REST API endpoints
 * - Callable Functions: Client SDK callable functions
 * - Triggers: Firestore, Auth, Storage triggers
 */

const functions = require("firebase-functions/v1");
const REGION = "asia-southeast1";

// HTTP Functions - User
const httpHandlers = require("./src/handlers/http/userHandlers");
exports.getCurrentUser = functions.region(REGION).https.onRequest(httpHandlers.getCurrentUser);
exports.updateCurrentUser = functions.region(REGION).https.onRequest(httpHandlers.updateCurrentUser);
exports.getUserSessions = functions.region(REGION).https.onRequest(httpHandlers.getUserSessions);
exports.revokeSession = functions.region(REGION).https.onRequest(httpHandlers.revokeSession);
exports.revokeAllOtherSessions = functions
    .region(REGION)
    .https.onRequest(httpHandlers.revokeAllOtherSessions);
exports.trackSession = functions.region(REGION).https.onRequest(httpHandlers.trackSession);

// Shopee HTTP Functions
const shopeeHandlers = require("./src/handlers/http/shopeeHandlers");
exports.getAllOrdersAndCheckouts = functions
    .region(REGION)
    .https.onRequest(shopeeHandlers.getAllOrdersAndCheckouts);
exports.getOrderDetail = functions.region(REGION).https.onRequest(shopeeHandlers.getOrderDetail);
exports.genShopeeQR = functions.region(REGION).https.onRequest(shopeeHandlers.genShopeeQR);
exports.checkShopeeQR = functions.region(REGION).https.onRequest(shopeeHandlers.checkShopeeQR);
exports.loginShopeeQR = functions.region(REGION).https.onRequest(shopeeHandlers.loginShopeeQR);

// Callable Functions
const callableHandlers = require("./src/handlers/callable/userCallable");
exports.getUserProfile = functions.region(REGION).https.onCall(callableHandlers.getUserProfile);
exports.updateUserProfile = functions
    .region(REGION)
    .https.onCall(callableHandlers.updateUserProfile);

// Firestore Triggers
// Temporarily disabled - will enable after Eventarc permissions are set up
// Wait 5-10 minutes after first 2nd gen function deployment, then retry
// const firestoreTriggers = require("./src/handlers/triggers/firestoreTriggers");
// exports.onUserCreate = firestoreTriggers.onUserCreate;
// exports.onUserUpdate = firestoreTriggers.onUserUpdate;
