import {
  DashboardOutlined,
  SafetyOutlined,
  UserOutlined,
  FileTextOutlined,
  ShopOutlined,
  GiftOutlined,
  CloudServerOutlined,
  MessageOutlined,
} from '@ant-design/icons'

// Map path -> UI meta (label/icon/group)
export const DASHBOARD_ROUTE_META = {
  '/dashboard': { label: 'Tổng quan', icon: DashboardOutlined },
  '/dashboard/permissions': { label: 'Phân quyền', icon: SafetyOutlined },
  '/dashboard/users': { label: 'Quản lý người dùng', icon: UserOutlined },
  '/dashboard/logs': { label: 'Theo dõi Log', icon: FileTextOutlined },
  '/dashboard/proxy': { label: 'Quản lý Proxy', icon: CloudServerOutlined },
  '/dashboard/feedback': { label: 'Feedback', icon: MessageOutlined },
  '/dashboard/shopee/vouchers': { label: 'Thêm voucher', icon: GiftOutlined, group: 'Dịch vụ Shopee' },
}

export const DASHBOARD_GROUP_META = {
  'Dịch vụ Shopee': { label: 'Dịch vụ Shopee', icon: ShopOutlined },
}

export const buildDashboardMenuFromRoutes = (routes = []) => {
  // Only dashboard routes
  const dashboardRoutes = routes
    .map((r) => r?.path)
    .filter((p) => typeof p === 'string' && p.startsWith('/dashboard'))

  // Build items
  const rootItems = []
  const groups = {}

  for (const path of dashboardRoutes) {
    const meta = DASHBOARD_ROUTE_META[path]
    if (!meta) continue // unknown route -> ignore

    if (meta.group) {
      if (!groups[meta.group]) {
        const groupMeta = DASHBOARD_GROUP_META[meta.group]
        groups[meta.group] = {
          label: groupMeta?.label || meta.group,
          icon: groupMeta?.icon,
          children: [],
        }
      }
      groups[meta.group].children.push({
        label: meta.label,
        to: path,
        icon: meta.icon,
      })
    } else {
      rootItems.push({
        label: meta.label,
        to: path,
        icon: meta.icon,
      })
    }
  }

  // sort root a bit (dashboard first if exists)
  rootItems.sort((a, b) => {
    if (a.to === '/dashboard') return -1
    if (b.to === '/dashboard') return 1
    return a.label.localeCompare(b.label)
  })

  // add groups in stable order
  const groupItems = Object.values(groups).map((g) => {
    g.children.sort((a, b) => a.label.localeCompare(b.label))
    return g
  })

  return [...rootItems, ...groupItems]
}

