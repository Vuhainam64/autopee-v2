/**
 * User Service
 * Business logic for user operations
 */

const { db } = require('../config')
const { NotFoundError, ValidationError } = require('../utils/errors')
const logger = require('../utils/logger')

/**
 * Get user profile from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User profile data or null if not found
 */
const getUserProfile = async (userId) => {
  try {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return null
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    }
  } catch (error) {
    logger.error('Failed to get user profile', error, { userId })
    throw error
  }
}

/**
 * Update user profile in Firestore
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated user profile
 */
const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    // Get existing data or empty object
    const existingData = userDoc.exists ? userDoc.data() : {}
    
    // Prepare update data - only include defined fields
    const updateData = {
      updatedAt: new Date().toISOString(),
    }

    // Only update fields that are provided
    if (profileData.displayName !== undefined) {
      updateData.displayName = profileData.displayName
    }
    if (profileData.phone !== undefined) {
      updateData.phone = profileData.phone
    }
    if (profileData.dateOfBirth !== undefined) {
      updateData.dateOfBirth = profileData.dateOfBirth
    }
    if (profileData.gender !== undefined) {
      updateData.gender = profileData.gender
    }
    if (profileData.photoURL !== undefined) {
      updateData.photoURL = profileData.photoURL
    }

    // If user doesn't exist, create with createdAt
    if (!userDoc.exists) {
      updateData.createdAt = new Date().toISOString()
    }

    await userRef.set(updateData, { merge: true })

    // Return merged data without reading again
    return {
      id: userRef.id,
      ...existingData,
      ...updateData,
    }
  } catch (error) {
    logger.error('Failed to update user profile', error, { userId })
    throw error
  }
}

/**
 * Create user document in Firestore
 * @param {string} userId - User ID
 * @param {object} userData - Initial user data
 * @returns {Promise<object>} Created user document
 */
const createUser = async (userId, userData) => {
  try {
    const userRef = db.collection('users').doc(userId)
    const newUserData = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await userRef.set(newUserData)

    return {
      id: userRef.id,
      ...newUserData,
    }
  } catch (error) {
    logger.error('Failed to create user', error, { userId })
    throw error
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  createUser,
}

