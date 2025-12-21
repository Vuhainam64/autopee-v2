import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Dropdown } from 'antd'
import { LogoutOutlined, SettingOutlined, DashboardOutlined, WalletOutlined } from '@ant-design/icons'
import LogoMark from '../branding/LogoMark.jsx'
import LoginModal from '../auth/LoginModal.jsx'
import RegisterModal from '../auth/RegisterModal.jsx'
import ForgotPasswordModal from '../auth/ForgotPasswordModal.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useAppSelector } from '../../store/hooks.js'
import { usePermissions } from '../../contexts/PermissionContext.jsx'
import Avatar from '../common/Avatar.jsx'

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Tài liệu', to: '/docs' },
  { label: 'Liên hệ', to: '#contact' },
]

function TopNav() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const { currentUser, logout } = useAuth()
  const userProfileFromStore = useAppSelector((state) => state.user.userProfile)
  const currentUserFromStore = useAppSelector((state) => state.user.currentUser)
  const userProfile = userProfileFromStore || currentUserFromStore
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  
  // Check permission để vào dashboard thay vì hardcode role
  // Nếu đang load permissions, không hiển thị menu để tránh flicker
  const canAccessDashboard = !permissionsLoading && hasPermission('/dashboard')

  const balanceText = (() => {
    const balance =
      userProfile?.walletBalance ??
      userProfile?.balance ??
      userProfile?.wallet?.balance ??
      0
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(balance)
  })()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const userMenuItems = [
    ...(canAccessDashboard
      ? [
          {
            key: 'dashboard',
            label: (
              <Link
                to="/dashboard"
                className="flex w-full items-center gap-2 text-slate-700 hover:text-orange-600"
              >
                <DashboardOutlined />
                Dashboard
              </Link>
            ),
          },
          {
            type: 'divider',
          },
        ]
      : []),
    {
      key: 'settings',
      label: (
        <Link
          to="/settings/profile"
          className="flex w-full items-center gap-2 text-slate-700 hover:text-orange-600"
        >
          <SettingOutlined />
          Settings
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 text-red-600 hover:text-red-700"
        >
          <LogoutOutlined />
          Đăng xuất
        </button>
      ),
    },
  ]

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="shrink-0">
            <LogoMark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) =>
              item.to.startsWith('#') ? (
                <a
                  key={item.label}
                  className="transition hover:text-orange-500"
                  href={item.to}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  className="transition hover:text-orange-500"
                  to={item.to}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm md:flex">
                <WalletOutlined />
                <span>{balanceText}</span>
                <Link
                  to="/settings/wallet"
                  className="rounded-full bg-orange-500 px-2 py-[2px] text-white hover:bg-orange-600"
                >
                  Nạp tiền
                </Link>
              </div>
            )}
            {currentUser ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  className="flex items-center gap-2"
                >
                  <Avatar
                    photoURL={userProfile?.photoURL || currentUser?.photoURL}
                    displayName={userProfile?.displayName || currentUser?.displayName}
                    email={currentUser.email}
                    size={28}
                  />
                  <span className="hidden md:inline">{currentUser.email}</span>
                </Button>
              </Dropdown>
            ) : (
              <>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="rounded-full border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Đăng nhập
                </button>
                <Link
                  to="/products"
                  className="hidden rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 md:inline-flex"
                >
                  Dùng thử ngay
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={() => {
          setLoginOpen(false)
          setRegisterOpen(true)
        }}
        onSwitchToForgot={() => {
          setLoginOpen(false)
          setForgotOpen(true)
        }}
      />

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => {
          setRegisterOpen(false)
          setLoginOpen(true)
        }}
      />

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onSwitchToLogin={() => {
          setForgotOpen(false)
          setLoginOpen(true)
        }}
      />
    </>
  )
}

export default TopNav

