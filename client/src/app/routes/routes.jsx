// Main routes
import OrdersLanding from '../features/orders/pages/OrdersLanding.jsx'
import NotFound from '../pages/NotFound.jsx'
import Unauthorized from '../pages/Unauthorized.jsx'

// Dashboard routes
import Dashboard from '../pages/Dashboard.jsx'
import Permissions from '../pages/dashboard/Permissions.jsx'
import Users from '../pages/dashboard/Users.jsx'
import Logs from '../pages/dashboard/Logs.jsx'

// Product routes
import Products from '../pages/Products.jsx'
import CheckMVDCookie from '../pages/CheckMVDCookie.jsx'
import CheckMVD from '../pages/CheckMVD.jsx'
import CheckPhone from '../pages/shopee/CheckPhone.jsx'
import AddressManagement from '../pages/shopee/AddressManagement.jsx'
import GetVoucher from '../pages/shopee/GetVoucher.jsx'
import AddVoucher from '../pages/dashboard/AddVoucher.jsx'

// Settings routes
import ProfileSettings from '../pages/settings/ProfileSettings.jsx'
import WalletSettings from '../pages/settings/WalletSettings.jsx'
import SecuritySettings from '../pages/settings/SecuritySettings.jsx'
import ApiSettings from '../pages/settings/ApiSettings.jsx'
import TransactionHistory from '../pages/settings/TransactionHistory.jsx'

/**
 * Route configuration
 * 
 * Structure:
 * - appRoutes: Main routes với MainLayout
 * - dashboardRoutes: Admin dashboard routes với DashboardLayout
 * - productRoutes: Product routes với ProductLayout
 * - settingsRoutes: Settings routes với SettingsLayout
 * 
 * Note: Route permissions are managed dynamically in MongoDB via /dashboard/permissions
 * Super admin can configure which roles can access each route through the admin panel.
 * This file only defines the route structure, not the permissions.
 */

// Main app routes - MainLayout
export const appRoutes = [
  {
    path: '/',
    element: <OrdersLanding />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
]

// Dashboard routes - DashboardLayout
// Permissions: Configured in /dashboard/permissions (default: admin, super_admin)
export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/dashboard/permissions',
    element: <Permissions />,
  },
  {
    path: '/dashboard/users',
    element: <Users />,
  },
  {
    path: '/dashboard/logs',
    element: <Logs />,
  },
  {
    path: '/dashboard/shopee/vouchers',
    element: <AddVoucher />,
  },
]

// Product routes - ProductLayout
// Permissions: Configured in /dashboard/permissions
export const productRoutes = [
  {
    path: '/products',
    element: <Products />,
  },
  {
    path: '/products/checkMVDCookie',
    element: <CheckMVDCookie />,
  },
  {
    path: '/products/checkMVD',
    element: <CheckMVD />,
  },
  {
    path: '/products/shopee/check-phone',
    element: <CheckPhone />,
  },
  {
    path: '/products/shopee/address',
    element: <AddressManagement />,
  },
  {
    path: '/products/shopee/vouchers',
    element: <GetVoucher />,
  },
]

// Settings routes - SettingsLayout
// Permissions: Configured in /dashboard/permissions
export const settingsRoutes = [
  {
    path: '/settings/profile',
    element: <ProfileSettings />,
  },
  {
    path: '/settings/wallet',
    element: <WalletSettings />,
  },
  {
    path: '/settings/security',
    element: <SecuritySettings />,
  },
  {
    path: '/settings/api',
    element: <ApiSettings />,
  },
  {
    path: '/settings/history',
    element: <TransactionHistory />,
  },
]



