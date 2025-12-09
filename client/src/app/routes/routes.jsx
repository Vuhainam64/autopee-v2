import OrdersLanding from '../features/orders/pages/OrdersLanding.jsx'
import Products from '../pages/Products.jsx'
import CheckMVDCookie from '../pages/CheckMVDCookie.jsx'
import CheckMVD from '../pages/CheckMVD.jsx'
import NotFound from '../pages/NotFound.jsx'

// Route config để dễ mở rộng phân quyền / menu / breadcrumb sau này
export const appRoutes = [
  {
    path: '/',
    element: <OrdersLanding />,
    meta: { roles: ['admin', 'operator', 'viewer'] },
  },
  {
    path: '*',
    element: <NotFound />,
    meta: { public: true },
  },
]

// Product routes - có sidebar
export const productRoutes = [
  {
    path: '/products',
    element: <Products />,
    meta: { roles: ['admin', 'operator', 'viewer'] },
  },
  {
    path: '/products/checkMVDCookie',
    element: <CheckMVDCookie />,
    meta: { roles: ['admin', 'operator'] },
  },
  {
    path: '/products/checkMVD',
    element: <CheckMVD />,
    meta: { roles: ['admin', 'operator'] },
  },
]



