/**
 * Authentication API Service
 * Handles authentication-related API calls
 */

import { get, put } from './api.js'

/**
 * Get current user profile from API
 */
export const getCurrentUser = async () => {
  return await get('/getCurrentUser')
}

/**
 * Update user profile via API
 */
export const updateUserProfile = async (profileData) => {
  return await put('/updateCurrentUser', profileData)
}

