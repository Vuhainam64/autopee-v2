import { useEffect } from 'react'
import { AUTH_EVENTS } from '../utils/authEvents'

/**
 * Listen for global REQUIRE_LOGIN event and call `openLogin`.
 */
export default function useRequireLoginListener(openLogin, onAfterLogin) {
  useEffect(() => {
    if (!openLogin) return

    const handler = () => {
      // attach callback for after login if provided
      openLogin(true)
      if (typeof onAfterLogin === 'function') {
        window.__AUTOPEE_AFTER_LOGIN__ = onAfterLogin
      }
    }

    window.addEventListener(AUTH_EVENTS.REQUIRE_LOGIN, handler)
    return () => window.removeEventListener(AUTH_EVENTS.REQUIRE_LOGIN, handler)
  }, [openLogin, onAfterLogin])
}

