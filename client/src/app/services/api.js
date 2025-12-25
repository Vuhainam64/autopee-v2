/**
 * API Client Configuration
 * Base HTTP client for MongoDB API server
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Get Firebase Auth token for authenticated requests
 */
const getAuthToken = async () => {
  const { auth } = await import('../config/firebase.js')
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken()
  }
  return null
}

/**
 * Base fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const token = await getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      // Auto trigger login popup when missing/invalid token
      const rawMsg = data?.error?.message || data?.error || ''
      const msg = rawMsg === 'Missing bearer token' ? 'Vui lòng đăng nhập' : rawMsg
      if (response.status === 401 || rawMsg === 'Missing bearer token') {
        const { emitRequireLogin } = await import('../utils/authEvents.js')
        emitRequireLogin({ reason: 'login_required' })
      }

      // Tạo error object với thông tin đầy đủ để xử lý ở component
      const error = new Error(msg || `HTTP error! status: ${response.status}`)
      error.response = { data, status: response.status }
      throw error
    }

    return data
  } catch (error) {
    // Nếu error đã có response, giữ nguyên
    if (error.response) {
      throw error
    }
    // Nếu chưa có response, thêm vào
    console.error('API request failed:', error)
    throw error
  }
}

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'GET',
  })
}

/**
 * POST request
 */
export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT request
 */
export const put = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  })
}

export default {
  get,
  post,
  put,
  delete: del,
}

