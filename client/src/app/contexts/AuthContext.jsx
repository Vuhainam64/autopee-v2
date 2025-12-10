import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../config/firebase.js'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const trackUserSession = async (user) => {
    try {
      if (user) {
        const token = await user.getIdToken()
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          const sessionId = payload.iat?.toString() || Date.now().toString()

          // Track session via API - server will get IP and device info from request headers
          const { post } = await import('../services/api.js')
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/auto-pee/asia-southeast1'
          await fetch(`${API_BASE_URL}/trackSession`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId,
              // IP and device info will be extracted from request headers on server-side
            }),
          }).catch(() => {
            // Silent fail - session tracking is not critical
          })
        }
      }
    } catch (error) {
      // Silent fail - session tracking is not critical
      console.warn('Failed to track session:', error)
    }
  }

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await trackUserSession(userCredential.user)
  }

  const register = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await trackUserSession(userCredential.user)
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    // Thêm scopes để lấy thông tin profile
    provider.addScope('profile')
    provider.addScope('email')
    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account',
    })
    const userCredential = await signInWithPopup(auth, provider)
    await trackUserSession(userCredential.user)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

