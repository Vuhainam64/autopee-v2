import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { WalletOutlined } from '@ant-design/icons'
import { 
  MdDashboard, 
  MdInventory2, 
  MdCookie,
  MdLocalShipping,
  MdStore,
  MdPhone,
  MdLocationOn,
  MdCardGiftcard
} from 'react-icons/md'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useAppSelector } from '../../store/hooks.js'
import Avatar from '../common/Avatar.jsx'

const menuItems = [
  { 
    label: 'Tổng quan sản phẩm', 
    to: '/products',
    icon: MdDashboard,
  },
  {
    label: 'Check Mã vận đơn',
    icon: MdInventory2,
    children: [
      { 
        label: 'Cookie', 
        to: '/products/checkMVDCookie',
        icon: MdCookie,
      },
      { 
        label: 'Mã vận', 
        to: '/products/checkMVD',
        icon: MdLocalShipping,
      },
    ],
  },
  {
    label: 'Dịch vụ Shopee',
    icon: MdStore,
    children: [
      { 
        label: 'Check Số', 
        to: '/products/shopee/check-phone',
        icon: MdPhone,
      },
      { 
        label: 'Quản lý địa chỉ', 
        to: '/products/shopee/address',
        icon: MdLocationOn,
      },
      { 
        label: 'Lấy Voucher', 
        to: '/products/shopee/vouchers',
        icon: MdCardGiftcard,
      },
    ],
  },
]

function SideNav({ collapsed = false, onToggle }) {
  const { pathname } = useLocation()
  const [expandedItems, setExpandedItems] = useState(['Check Mã vận đơn', 'Dịch vụ Shopee'])
  const { currentUser } = useAuth()
  const userProfile = useAppSelector((state) => state.user.userProfile)

  const { displayName, uid, balanceText, photoURL } = useMemo(() => {
    const name =
      userProfile?.displayName ||
      currentUser?.displayName ||
      currentUser?.email?.split('@')[0] ||
      'Người dùng'
    const id = userProfile?.id || currentUser?.uid || '—'
    const photo =
      userProfile?.photoURL ||
      currentUser?.photoURL ||
      null
    const balance =
      userProfile?.walletBalance ??
      userProfile?.balance ??
      userProfile?.wallet?.balance ??
      0
    const formatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(balance)
    return { displayName: name, uid: id, balanceText: formatted, photoURL: photo }
  }, [userProfile, currentUser])

  const toggleExpand = (label) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    )
  }

  const isActive = (to) => pathname === to
  const hasActiveChild = (children) =>
    children?.some((child) => isActive(child.to))

  return (
    <aside
      className={`flex h-full flex-col shrink-0 rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-full max-w-[240px]'
      }`}
      style={{ maxHeight: 'calc(100vh - 8rem)' }}
    >
      {/* Header - Fixed */}
      <div className="flex items-center justify-between shrink-0">
        {!collapsed && (
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            Điều hướng
          </div>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className="ml-auto flex items-center justify-center text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          size="small"
        />
      </div>

      {/* Navigation - Scrollable */}
      <nav className={`mt-3 flex-1 overflow-y-auto flex flex-col gap-1 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-slate-100 ${collapsed ? 'items-center' : ''}`}>
        {menuItems.map((item) => {
          if (item.children) {
            const isExpanded = expandedItems.includes(item.label)
            const hasActive = hasActiveChild(item.children)

            const Icon = item.icon
            
            if (collapsed) {
              return (
                <button
                  key={item.label}
                  onClick={() => toggleExpand(item.label)}
                  className="w-10 flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  title={item.label}
                >
                  {Icon && <Icon className="text-lg" />}
                </button>
              )
            }

            return (
              <div key={item.label} className="flex flex-col">
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                    hasActive
                      ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="text-base" />}
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <UpOutlined className="text-xs" />
                  ) : (
                    <DownOutlined className="text-xs" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-orange-100 pl-2">
                    {item.children.map((child) => {
                      const active = isActive(child.to)
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
                            active
                              ? 'bg-orange-50 text-orange-600 font-medium'
                              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
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

          const active = isActive(item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                collapsed ? 'w-10 flex items-center justify-center' : 'flex items-center gap-2'
              } ${
                active
                  ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
              title={collapsed ? item.label : ''}
            >
              {Icon && <Icon className={collapsed ? 'text-lg' : 'text-base'} />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer - Fixed at bottom - Chỉ hiển thị khi đã đăng nhập */}
      {currentUser && (
        <div className="mt-4 space-y-3 shrink-0">
          <Link
            to="/settings/wallet"
            className={`flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 ${
              collapsed ? 'w-10 px-0 py-2' : 'w-full'
            }`}
            title="Nạp tiền"
          >
            <WalletOutlined />
            {!collapsed && <span>Nạp tiền</span>}
          </Link>
          <div
            className={`flex items-center gap-3 rounded-xl border border-orange-50 shadow-sm ${
              collapsed ? 'p-2 justify-center' : 'p-3'
            }`}
          >
            <Avatar
              photoURL={photoURL}
              displayName={displayName}
              email={currentUser?.email}
              size={28}
            />
            {!collapsed && (
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-slate-800">{displayName}</div>
                <div className="text-sm font-medium text-orange-600">{balanceText}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

export default SideNav

