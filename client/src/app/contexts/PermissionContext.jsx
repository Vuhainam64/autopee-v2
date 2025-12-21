import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { get } from '../services/api.js'

const PermissionContext = createContext(null)

/**
 * Permission Provider - Quản lý permissions tập trung
 * Cache permissions để tránh fetch nhiều lần
 */
export const PermissionProvider = ({ children }) => {
  const [routes, setRoutes] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch route permissions mà user có quyền truy cập
  // Endpoint này tự động lấy userRole và trả về routes mà user có quyền
  const fetchRoutes = useCallback(async () => {
    try {
      const response = await get('/user/routes')
      
      if (response?.data) {
        // Cập nhật routes và userRole từ response
        // Tạo array mới để đảm bảo reference thay đổi và trigger re-render
        if (response.data.routes) {
          const routesArray = Array.isArray(response.data.routes) 
            ? [...response.data.routes] 
            : []
          setRoutes(routesArray)
        }
        if (response.data.userRole) {
          setUserRole(response.data.userRole)
        }
        return response.data.routes || []
      }
      return []
    } catch (error) {
      console.error('Error fetching routes:', error)
      // Nếu không có quyền hoặc lỗi, set empty array
      setRoutes([])
      return []
    }
  }, [])

  // Load permissions
  const loadPermissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // fetchRoutes đã tự động lấy userRole và routes từ /user/routes endpoint
      await fetchRoutes()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [fetchRoutes])

  // Initial load
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  /**
   * Check xem user có quyền truy cập route không
   * @param {string} path - Route path (ví dụ: '/dashboard/permissions')
   * @returns {boolean}
   * 
   * Note: Endpoint /user/routes đã filter sẵn routes mà user có quyền,
   * nên chỉ cần check xem route có tồn tại trong danh sách routes không
   */
  const hasPermission = useCallback(
    (path) => {
      if (!routes.length) {
        // Nếu chưa có routes, deny by default
        return false
      }

      // Tìm route permission trong danh sách routes đã được filter
      // Ưu tiên exact match trước
      let routePermission = routes.find((route) => route.path === path)

      // Nếu không tìm thấy exact match, thử tìm với prefix match
      // Cho phép parent route match với child routes
      // Ví dụ: /dashboard match với /dashboard/permissions
      if (!routePermission) {
        routePermission = routes.find((route) => {
          // Match exact
          if (path === route.path) {
            return true
          }
          
          // Parent route match: /dashboard match với /dashboard/permissions
          // Điều kiện: path phải bắt đầu bằng route.path và ký tự tiếp theo là '/'
          if (path.startsWith(route.path)) {
            const nextChar = path[route.path.length]
            return nextChar === undefined || nextChar === '/'
          }
          
          return false
        })
      }

      // Nếu tìm thấy route trong danh sách, user có quyền truy cập
      // (vì endpoint /user/routes đã filter sẵn)
      return !!routePermission
    },
    [routes]
  )

  const value = {
    routes,
    userRole,
    loading,
    error,
    hasPermission,
    refetch: loadPermissions,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

/**
 * Hook để sử dụng PermissionContext
 */
export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider')
  }
  return context
}

