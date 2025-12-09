import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Dropdown } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import LogoMark from '../branding/LogoMark.jsx'
import LoginModal from '../auth/LoginModal.jsx'
import RegisterModal from '../auth/RegisterModal.jsx'
import ForgotPasswordModal from '../auth/ForgotPasswordModal.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Tính năng', to: '#features' },
  { label: 'Liên hệ', to: '#contact' },
]

function TopNav() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const { currentUser, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const userMenuItems = [
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
            {currentUser ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  className="flex items-center gap-2"
                >
                  {currentUser.email}
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

