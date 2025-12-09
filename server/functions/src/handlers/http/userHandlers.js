/**
 * HTTP Handlers for User endpoints
 */

const { onRequest } = require('firebase-functions/v2/https')
const { verifyToken, handleHTTPErrors } = require('../../middleware')
const { getUserProfile, updateUserProfile } = require('../../services/userService')
const { validateSchema } = require('../../utils/validators')
const logger = require('../../utils/logger')

/**
 * Get current user profile
 * GET /getCurrentUser
 */
exports.getCurrentUser = onRequest(
  { cors: true, maxInstances: 10 },
  handleHTTPErrors(async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: { message: 'Method not allowed' } })
    }

    const user = await verifyToken(req)
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

    res.json({ success: true, data: profile })
  }),
)

/**
 * Update user profile
 * PUT /updateCurrentUser
 */
exports.updateCurrentUser = onRequest(
  { cors: true, maxInstances: 10 },
  handleHTTPErrors(async (req, res) => {
    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, error: { message: 'Method not allowed' } })
    }

    const user = await verifyToken(req)
    
    // Schema validation - all fields are optional
    const schema = {
      displayName: { type: 'string', minLength: 1, maxLength: 100 },
      phone: { type: 'string' },
      dateOfBirth: { type: 'string' },
      gender: { type: 'string' },
      photoURL: { type: 'string' },
    }

    // Validate only provided fields
    const body = req.body || {}
    const validatedData = {}

    if (body.displayName !== undefined) {
      // Allow empty string to clear the field, or valid string
      if (body.displayName !== null && body.displayName !== '' && typeof body.displayName !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'displayName must be a string' },
        })
      }
      // Validate length only if provided and not empty
      if (body.displayName && body.displayName.trim() !== '') {
        if (body.displayName.length < 1 || body.displayName.length > 100) {
          return res.status(400).json({
            success: false,
            error: { message: 'displayName must be between 1 and 100 characters' },
          })
        }
        validatedData.displayName = body.displayName.trim()
      } else {
        // Allow clearing the field
        validatedData.displayName = body.displayName || null
      }
    }

    if (body.phone !== undefined) {
      // Allow empty string, null, or valid phone number
      if (body.phone !== null && body.phone !== '' && typeof body.phone !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'phone must be a string' },
        })
      }
      // Validate phone format only if provided and not empty
      if (body.phone && body.phone.trim() !== '' && !/^[0-9]{10,11}$/.test(body.phone.trim())) {
        return res.status(400).json({
          success: false,
          error: { message: 'phone must be 10-11 digits' },
        })
      }
      // Convert empty string to null
      validatedData.phone = body.phone && body.phone.trim() !== '' ? body.phone.trim() : null
    }

    if (body.dateOfBirth !== undefined) {
      if (body.dateOfBirth !== null && typeof body.dateOfBirth !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'dateOfBirth must be a string or null' },
        })
      }
      validatedData.dateOfBirth = body.dateOfBirth || null
    }

    if (body.gender !== undefined) {
      if (body.gender !== null && !['male', 'female', 'other'].includes(body.gender)) {
        return res.status(400).json({
          success: false,
          error: { message: 'gender must be one of: male, female, other' },
        })
      }
      validatedData.gender = body.gender || null
    }

    if (body.photoURL !== undefined) {
      if (typeof body.photoURL !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'photoURL must be a string' },
        })
      }
      validatedData.photoURL = body.photoURL || null
    }

    const updatedProfile = await updateUserProfile(user.uid, validatedData)

    logger.info('User profile updated', { uid: user.uid, updatedFields: Object.keys(validatedData) })
    res.json({ success: true, data: updatedProfile })
  }),
)

