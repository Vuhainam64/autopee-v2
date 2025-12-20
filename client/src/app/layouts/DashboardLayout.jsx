import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import { Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SafetyOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import logo from '../../assets/autopee-logo.png'

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
    label: 'Thống kê',
    to: '/dashboard/analytics',
    icon: BarChartOutlined,
  },
  {
    label: 'Cài đặt',
    to: '/dashboard/settings',
    icon: SettingOutlined,
  },
]

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()

  const isActive = (to) => {
    if (to === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(to)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`shrink-0 border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${
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

        {/* Navigation */}
        <nav className="p-4">
          <div className="flex flex-col gap-1">
            {dashboardMenuItems.map((item) => {
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout

