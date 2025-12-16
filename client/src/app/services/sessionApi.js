/**
 * Session API Service
 * Handles session-related API calls
 */

import { post } from './api.js'

/**
 * Create or update session record
 * This is called internally, not exposed to components
 */
export const createOrUpdateSession = async (userId, sessionId, sessionData) => {
  // This will be handled server-side when user logs in
  // For now, we'll track it via a separate endpoint if needed
  return await post('/user/sessions/track', {
    userId,
    sessionId,
    ...sessionData,
  })
}

