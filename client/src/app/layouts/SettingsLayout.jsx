import { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import TopNav from '../components/navigation/TopNav.jsx'
import Footer from '../components/navigation/Footer.jsx'
import { Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  WalletOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons'

const settingsMenuItems = [
  { label: 'Profile', to: '/settings/profile', icon: UserOutlined },
  { label: 'Ví của tôi', to: '/settings/wallet', icon: WalletOutlined },
  { label: 'Bảo mật', to: '/settings/security', icon: SecurityScanOutlined },
]

function SettingsLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-6 pb-16 pt-10">
        <aside
          className={`shrink-0 rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 ${
            collapsed ? 'w-[64px]' : 'w-full max-w-[240px]'
          }`}
        >
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                Cài đặt
              </div>
            )}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto flex items-center justify-center text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              size="small"
            />
          </div>
          <nav className={`mt-3 flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
            {settingsMenuItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.to

              if (collapsed) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`w-10 flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                        : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                    title={item.label}
                  >
                    <Icon />
                  </Link>
                )
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default SettingsLayout

