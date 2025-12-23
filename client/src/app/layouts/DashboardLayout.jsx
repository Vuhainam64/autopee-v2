import { useState, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import { Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SafetyOutlined,
  UserOutlined,
  FileTextOutlined,
  ShopOutlined,
  GiftOutlined,
  CloudServerOutlined,
} from '@ant-design/icons'
import logo from '../../assets/autopee-logo.png'
import { usePermissions } from '../contexts/PermissionContext.jsx'

const dashboardMenuItems = [
  {
    label: 'Tổng quan',
    to: '/dashboard',
    icon: DashboardOutlined,
  },
  {
    label: 'Phân quyền',
    to: '/dashboard/permissions',
    icon: SafetyOutlined,
  },
  {
    label: 'Quản lý người dùng',
    to: '/dashboard/users',
    icon: UserOutlined,
  },
  {
    label: 'Theo dõi Log',
    to: '/dashboard/logs',
    icon: FileTextOutlined,
  },
  {
    label: 'Quản lý Proxy',
    to: '/dashboard/proxy',
    icon: CloudServerOutlined,
  },
  {
    label: 'Dịch vụ Shopee',
    icon: ShopOutlined,
    children: [
      {
        label: 'Thêm voucher',
        to: '/dashboard/shopee/vouchers',
        icon: GiftOutlined,
      },
    ],
  },
]

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState(['Dịch vụ Shopee'])
  const { pathname } = useLocation()
  const { loading, routes } = usePermissions()

  // Filter menu items dựa trên permissions
  const visibleMenuItems = useMemo(() => {
    if (loading) {
      // Khi đang load, hiển thị tất cả để tránh flicker
      return dashboardMenuItems
    }
    
    if (!routes.length) {
      return []
    }
    
    // Check permissions trực tiếp từ routes array
    // Endpoint /user/routes đã filter sẵn routes mà user có quyền
    // CHỈ match exact, KHÔNG match prefix để tránh hiển thị menu items mà user không có quyền
    return dashboardMenuItems.filter((item) => {
      // Nếu có children, check children
      if (item.children) {
        return item.children.some((child) => {
          const routePermission = routes.find((route) => route.path === child.to)
          return !!routePermission
        })
      }
      // CHỈ tìm exact match - route phải có trong danh sách routes mà user có quyền
      const routePermission = routes.find((route) => route.path === item.to)
      return !!routePermission
    })
  }, [loading, routes])

  const isActive = (to) => {
    if (to === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(to)
  }

  const hasActiveChild = (children) =>
    children?.some((child) => isActive(child.to))

  const toggleExpand = (label) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Fixed */}
      <aside
        className={`fixed left-0 top-0 z-10 h-screen border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${
          collapsed ? 'w-[64px]' : 'w-[260px]'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          {!collapsed && (
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img
                src={logo}
                alt="Autopee"
                className="h-8 w-8 rounded-xl bg-orange-500 p-1 shadow-sm"
              />
              <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
            </Link>
          )}
          {collapsed && (
            <Link
              to="/"
              className="mx-auto transition-opacity hover:opacity-80"
              title="Về trang chủ"
            >
              <img
                src={logo}
                alt="Autopee"
                className="h-8 w-8 rounded-xl bg-orange-500 p-1 shadow-sm"
              />
            </Link>
          )}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            size="small"
          />
        </div>

        {/* Navigation - Scrollable với scrollbar */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-slate-100 p-4">
          <div className="flex flex-col gap-1">
            {visibleMenuItems.map((item) => {
              // Nếu có children, render sub-menu
              if (item.children) {
                const isExpanded = expandedItems.includes(item.label)
                const hasActive = hasActiveChild(item.children)
                const Icon = item.icon

                if (collapsed) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => toggleExpand(item.label)}
                      className="w-full flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                      title={item.label}
                    >
                      <Icon className="text-lg" />
                    </button>
                  )
                }

                return (
                  <div key={item.label} className="flex flex-col">
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        hasActive
                          ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                          : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="text-base" />
                        <span>{item.label}</span>
                      </div>
                      <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-orange-100 pl-3">
                        {item.children.map((child) => {
                          const childActive = isActive(child.to)
                          const ChildIcon = child.icon
                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                                childActive
                                  ? 'bg-orange-50 text-orange-600'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              {ChildIcon && <ChildIcon className="text-sm" />}
                              <span>{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // Menu item không có children
              const active = isActive(item.to)
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    active
                      ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon
                    className={`text-base transition-transform ${
                      active ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-700'
                    } ${collapsed ? 'text-lg' : ''}`}
                  />
                  {!collapsed && (
                    <span className={`transition-colors ${active ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Footer section (optional - có thể thêm user info) */}
          {!collapsed && (
            <div className="mt-8 border-t border-slate-200 pt-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Admin Panel</p>
                <p className="mt-1 text-xs text-slate-400">
                  Quản lý hệ thống và phân quyền
                </p>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content - Scrollable với scrollbar */}
      <main
        className={`flex-1 h-screen overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-slate-100 transition-all duration-300 ${
          collapsed ? 'ml-[64px]' : 'ml-[260px]'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout

