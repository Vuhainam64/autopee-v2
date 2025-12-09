/**
 * Callable Functions for User operations
 */

const { onCall } = require('firebase-functions/v2/https')
const { authenticateCallable, handleCallableErrors } = require('../../middleware')
const { getUserProfile, updateUserProfile } = require('../../services/userService')
const { validateSchema } = require('../../utils/validators')

/**
 * Get user profile (Callable)
 */
exports.getUserProfile = onCall(
  { maxInstances: 10 },
  handleCallableErrors(async (data, context) => {
    const user = await authenticateCallable(data, context)
    let profile = await getUserProfile(user.uid)

    // If profile doesn't exist, return basic user info
    if (!profile) {
      profile = {
        id: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.email?.split('@')[0] || '',
      }
    }

    return {
      success: true,
      data: profile,
    }
  }),
)

/**
 * Update user profile (Callable)
 */
exports.updateUserProfile = onCall(
  { maxInstances: 10 },
  handleCallableErrors(async (data, context) => {
    const user = await authenticateCallable(data, context)

    // Validate and prepare data
    const validatedData = {}

    if (data.displayName !== undefined) {
      // Allow empty string to clear the field, or valid string
      if (data.displayName !== null && data.displayName !== '' && typeof data.displayName !== 'string') {
        throw new Error('displayName must be a string')
      }
      // Validate length only if provided and not empty
      if (data.displayName && data.displayName.trim() !== '') {
        if (data.displayName.length < 1 || data.displayName.length > 100) {
          throw new Error('displayName must be between 1 and 100 characters')
        }
        validatedData.displayName = data.displayName.trim()
      } else {
        // Allow clearing the field
        validatedData.displayName = data.displayName || null
      }
    }

    if (data.phone !== undefined) {
      // Allow empty string, null, or valid phone number
      if (data.phone !== null && data.phone !== '' && typeof data.phone !== 'string') {
        throw new Error('phone must be a string')
      }
      // Validate phone format only if provided and not empty
      if (data.phone && data.phone.trim() !== '' && !/^[0-9]{10,11}$/.test(data.phone.trim())) {
        throw new Error('phone must be 10-11 digits')
      }
      // Convert empty string to null
      validatedData.phone = data.phone && data.phone.trim() !== '' ? data.phone.trim() : null
    }

    if (data.dateOfBirth !== undefined) {
      if (data.dateOfBirth !== null && typeof data.dateOfBirth !== 'string') {
        throw new Error('dateOfBirth must be a string or null')
      }
      validatedData.dateOfBirth = data.dateOfBirth || null
    }

    if (data.gender !== undefined) {
      if (data.gender !== null && !['male', 'female', 'other'].includes(data.gender)) {
        throw new Error('gender must be one of: male, female, other')
      }
      validatedData.gender = data.gender || null
    }

    if (data.photoURL !== undefined) {
      if (typeof data.photoURL !== 'string') {
        throw new Error('photoURL must be a string')
      }
      validatedData.photoURL = data.photoURL || null
    }

    const updatedProfile = await updateUserProfile(user.uid, validatedData)

    return {
      success: true,
      data: updatedProfile,
    }
  }),
)

