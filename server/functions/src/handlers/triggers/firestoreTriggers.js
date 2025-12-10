/**
 * Firestore Triggers
 * Automatically triggered when documents change
 */

const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {logger} = require("../../utils/logger");

/**
 * Trigger when a new user is created in Firebase Auth
 * Creates corresponding user document in Firestore
 */
exports.onUserCreate = onDocumentCreated(
    {
      document: "users/{userId}",
      maxInstances: 10,
    },
    async (event) => {
      try {
        const userId = event.params.userId;
        const userData = event.data.data();

        logger.info("New user document created", {userId, userData});
      // Additional processing can be added here
      } catch (error) {
        logger.error("Error in onUserCreate trigger", error);
        throw error;
      }
    },
);

/**
 * Trigger when user document is updated
 */
exports.onUserUpdate = onDocumentUpdated(
    {
      document: "users/{userId}",
      maxInstances: 10,
    },
    async (event) => {
      try {
        const userId = event.params.userId;
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();

        logger.info("User document updated", {
          userId,
          changes: {
            before: beforeData,
            after: afterData,
          },
        });
      // Additional processing can be added here
      } catch (error) {
        logger.error("Error in onUserUpdate trigger", error);
        throw error;
      }
    },
);

