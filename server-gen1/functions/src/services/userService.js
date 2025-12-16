const {db} = require("../firebase");
const logger = require("../utils/logger");

const getUserProfile = async (userId) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return null;
    return {id: userDoc.id, ...userDoc.data()};
  } catch (error) {
    logger.error("Failed to get user profile", error, {userId});
    throw error;
  }
};

const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const existingData = userDoc.exists ? userDoc.data() : {};

    const updateData = {updatedAt: new Date().toISOString()};
    if (profileData.displayName !== undefined) updateData.displayName = profileData.displayName;
    if (profileData.phone !== undefined) updateData.phone = profileData.phone;
    if (profileData.dateOfBirth !== undefined) updateData.dateOfBirth = profileData.dateOfBirth;
    if (profileData.gender !== undefined) updateData.gender = profileData.gender;
    if (profileData.photoURL !== undefined) updateData.photoURL = profileData.photoURL;
    if (!userDoc.exists) updateData.createdAt = new Date().toISOString();

    await userRef.set(updateData, {merge: true});
    return {id: userRef.id, ...existingData, ...updateData};
  } catch (error) {
    logger.error("Failed to update user profile", error, {userId});
    throw error;
  }
};

module.exports = {getUserProfile, updateUserProfile};

