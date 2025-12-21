import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { usePermissions } from '../contexts/PermissionContext.jsx'

/**
 * ProtectedRoute Component
 * Bảo vệ routes dựa trên permissions từ database
 * 
 * @param {ReactNode} children - Component cần được protect
 * @param {string} requiredPath - Path cần check permission (optional, sẽ dùng location.pathname nếu không có)
 */
function ProtectedRoute({ children, requiredPath }) {
  const location = useLocation()
  const { hasPermission, loading } = usePermissions()
  const pathToCheck = requiredPath || location.pathname

  // Show loading khi đang fetch permissions
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    )
  }

  // Check permission
  if (!hasPermission(pathToCheck)) {
    // Redirect đến trang 403 Unauthorized
    return <Navigate to="/unauthorized" replace state={{ from: location, deniedPath: pathToCheck }} />
  }

  return children
}

export default ProtectedRoute

