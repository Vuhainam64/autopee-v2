/**
 * Authentication API Service
 * Handles authentication-related API calls
 */

import { get, put, post } from './api.js'

/**
 * Get current user profile from API
 */
export const getCurrentUser = async () => {
  return await get('/user/me')
}

/**
 * Update user profile via API
 */
export const updateUserProfile = async (profileData) => {
  return await put('/user/me', profileData)
}

/**
 * Get user active sessions
 */
export const getUserSessions = async () => {
  return await get('/user/sessions')
}

/**
 * Revoke a specific session
 */
export const revokeSession = async (sessionId) => {
  return await post('/user/sessions/revoke', { sessionId })
}

/**
 * Revoke all other sessions (except current)
 */
export const revokeAllOtherSessions = async () => {
  return await post('/user/sessions/revoke-others', {})
}

