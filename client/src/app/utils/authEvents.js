// Simple global event bus for auth-required situations

export const AUTH_EVENTS = {
  REQUIRE_LOGIN: 'AUTH_REQUIRE_LOGIN',
}

export const emitRequireLogin = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.REQUIRE_LOGIN, { detail }))
}

