import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { 
  MdDashboard, 
  MdInventory2, 
  MdCookie,
  MdLocalShipping 
} from 'react-icons/md'

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
]

function SideNav({ collapsed = false, onToggle }) {
  const { pathname } = useLocation()
  const [expandedItems, setExpandedItems] = useState(['Check Mã vận đơn'])

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
      className={`shrink-0 rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-full max-w-[240px]'
      }`}
    >
      <div className="flex items-center justify-between">
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
      <nav className={`mt-3 flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
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
    </aside>
  )
}

export default SideNav

