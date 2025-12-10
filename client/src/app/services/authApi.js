/**
 * Authentication API Service
 * Handles authentication-related API calls
 */

import { get, put, post } from './api.js'

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

/**
 * Get user active sessions
 */
export const getUserSessions = async () => {
  return await get('/getUserSessions')
}

/**
 * Revoke a specific session
 */
export const revokeSession = async (sessionId) => {
  return await post('/revokeSession', { sessionId })
}

/**
 * Revoke all other sessions (except current)
 */
export const revokeAllOtherSessions = async () => {
  return await post('/revokeAllOtherSessions', {})
}

