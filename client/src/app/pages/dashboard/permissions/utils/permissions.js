// Sắp xếp roles theo score từ API
export const sortRoles = (roles, rolesData) => {
  if (!roles || !Array.isArray(roles)) return []
  if (!rolesData || !Array.isArray(rolesData)) return roles
  
  const roleMap = new Map(rolesData.map((r) => [r.name, r.score || 0]))
  return [...roles].sort((a, b) => {
    const scoreA = roleMap.get(a) || 999
    const scoreB = roleMap.get(b) || 999
    return scoreA - scoreB
  })
}

// Generate pattern suggestions from existing routes and APIs
export const generateRoutePatternOptions = (routes) => {
  const pathPrefixes = new Set()
  routes.forEach((route) => {
    if (route.path) {
      const parts = route.path.split('/').filter(Boolean)
      if (parts.length > 0) {
        pathPrefixes.add(`/${parts[0]}`)
      }
      if (parts.length > 1) {
        pathPrefixes.add(`/${parts[0]}/${parts[1]}`)
      }
    }
  })
  return Array.from(pathPrefixes)
    .sort()
    .map((path) => ({ value: path, label: path }))
}

export const generateApiPatternOptions = (apis) => {
  const endpointPrefixes = new Set()
  apis.forEach((api) => {
    if (api.endpoint) {
      const parts = api.endpoint.split('/').filter(Boolean)
      if (parts.length > 0) {
        endpointPrefixes.add(`/${parts[0]}`)
      }
      if (parts.length > 1) {
        endpointPrefixes.add(`/${parts[0]}/${parts[1]}`)
      }
    }
  })
  return Array.from(endpointPrefixes)
    .sort()
    .map((endpoint) => ({ value: endpoint, label: endpoint }))
}

// Filter routes based on search text and pattern
export const filterRoutes = (routes, searchText, patternFilter) => {
  let filtered = routes
  if (searchText) {
    const search = searchText.toLowerCase()
    filtered = filtered.filter(
      (route) =>
        route.path?.toLowerCase().includes(search) ||
        route.method?.toLowerCase().includes(search) ||
        route.allowedRoles?.some((role) => role.toLowerCase().includes(search)) ||
        route.description?.toLowerCase().includes(search)
    )
  }
  if (patternFilter) {
    const pattern = patternFilter.toLowerCase()
    filtered = filtered.filter((route) => route.path?.toLowerCase().startsWith(pattern))
  }
  return filtered
}

// Filter APIs based on search text and pattern
export const filterApis = (apis, searchText, patternFilter) => {
  let filtered = apis
  if (searchText) {
    const search = searchText.toLowerCase()
    filtered = filtered.filter(
      (api) =>
        api.endpoint?.toLowerCase().includes(search) ||
        api.method?.toLowerCase().includes(search) ||
        api.allowedRoles?.some((role) => role.toLowerCase().includes(search)) ||
        api.description?.toLowerCase().includes(search)
    )
  }
  if (patternFilter) {
    const pattern = patternFilter.toLowerCase()
    filtered = filtered.filter((api) => api.endpoint?.toLowerCase().startsWith(pattern))
  }
  return filtered
}

