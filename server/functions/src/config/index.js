/**
 * Firebase Admin SDK Configuration
 * Initialize Firebase Admin with proper error handling
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    // Admin SDK already initialized
    console.warn("Firebase Admin already initialized:", error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage,
};

