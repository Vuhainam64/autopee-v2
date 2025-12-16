/**
 * Firestore Triggers
 * Automatically triggered when documents change
 */

const functions = require("firebase-functions/v1");
const {logger} = require("../../utils/logger");
const REGION = "asia-southeast1";

/**
 * Trigger when a new user is created in Firebase Auth
 * Creates corresponding user document in Firestore
 */
exports.onUserCreate = functions
    .region(REGION)
    .firestore.document("users/{userId}")
    .onCreate(async (snapshot, context) => {
      try {
        const userId = context.params.userId;
        const userData = snapshot.data();

        logger.info("New user document created", {userId, userData});
      } catch (error) {
        logger.error("Error in onUserCreate trigger", error);
        throw error;
      }
    });

/**
 * Trigger when user document is updated
 */
exports.onUserUpdate = functions
    .region(REGION)
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
      try {
        const userId = context.params.userId;
        const beforeData = change.before.data();
        const afterData = change.after.data();

        logger.info("User document updated", {
          userId,
          changes: {
            before: beforeData,
            after: afterData,
          },
        });
      } catch (error) {
        logger.error("Error in onUserUpdate trigger", error);
        throw error;
      }
    });

