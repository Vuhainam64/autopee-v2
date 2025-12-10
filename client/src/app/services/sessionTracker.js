/**
 * Session Tracker Service
 * Tracks user sessions when they log in
 */

import { createOrUpdateSession } from './sessionApi.js'

/**
 * Track a new session when user logs in
 * @param {string} userId - User ID
 * @param {string} token - Firebase Auth token
 */
export const trackSession = async (userId, token) => {
  try {
    // Get IP address and user agent from browser
    const ipAddress = await getIPAddress()
    const userAgent = navigator.userAgent
    const deviceInfo = getDeviceInfo(userAgent)

    // Decode token to get session ID (use issued time as identifier)
    const tokenParts = token.split('.')
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]))
      const sessionId = payload.iat?.toString() || Date.now().toString()

      await createOrUpdateSession(userId, sessionId, {
        ipAddress,
        userAgent,
        deviceInfo,
      })
    }
  } catch (error) {
    console.error('Failed to track session:', error)
    // Don't throw - session tracking is not critical
  }
}

/**
 * Get user's IP address (approximate)
 */
const getIPAddress = async () => {
  try {
    // Try to get IP from a public service
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'Unknown'
  } catch (error) {
    console.warn('Failed to get IP address:', error)
    return 'Unknown'
  }
}

/**
 * Extract device info from user agent
 */
const getDeviceInfo = (userAgent) => {
  if (!userAgent) return 'Unknown'

  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    if (/iPhone/.test(userAgent)) return 'iPhone'
    if (/iPad/.test(userAgent)) return 'iPad'
    if (/Android/.test(userAgent)) return 'Android'
    return 'Mobile'
  }

  if (/Windows/.test(userAgent)) return 'Windows'
  if (/Mac/.test(userAgent)) return 'Mac'
  if (/Linux/.test(userAgent)) return 'Linux'

  return 'Desktop'
}

