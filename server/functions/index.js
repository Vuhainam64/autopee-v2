/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions organized by type:
 * - HTTP Functions: REST API endpoints
 * - Callable Functions: Client SDK callable functions
 * - Triggers: Firestore, Auth, Storage triggers
 */

const { setGlobalOptions } = require('firebase-functions/v2')

// Global configuration for all functions
setGlobalOptions({
  maxInstances: 10,
  minInstances: 1, // Keep at least 1 instance warm to reduce cold starts
  region: 'asia-southeast1', // Singapore region for better latency in Vietnam
  memory: '256MiB', // Optimize memory allocation
})

// HTTP Functions
const httpHandlers = require('./src/handlers/http/userHandlers')
exports.getCurrentUser = httpHandlers.getCurrentUser
exports.updateCurrentUser = httpHandlers.updateCurrentUser

// Callable Functions
const callableHandlers = require('./src/handlers/callable/userCallable')
exports.getUserProfile = callableHandlers.getUserProfile
exports.updateUserProfile = callableHandlers.updateUserProfile

// Firestore Triggers
const firestoreTriggers = require('./src/handlers/triggers/firestoreTriggers')
exports.onUserCreate = firestoreTriggers.onUserCreate
exports.onUserUpdate = firestoreTriggers.onUserUpdate
