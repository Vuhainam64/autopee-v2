import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import ProductLayout from '../layouts/ProductLayout.jsx'
import SettingsLayout from '../layouts/SettingsLayout.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import NotFound from '../pages/NotFound.jsx'
import { appRoutes, productRoutes, settingsRoutes, dashboardRoutes } from './routes.jsx'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - không cần permission */}
        <Route element={<MainLayout />}>
          {appRoutes
            .filter((route) => route.path !== '*') // Filter out catch-all route
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
        </Route>

        {/* Protected routes - cần check permission */}
        <Route element={<DashboardLayout />}>
          {dashboardRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute requiredPath={route.path}>
                  {route.element}
                </ProtectedRoute>
              }
            />
          ))}
        </Route>

        <Route element={<ProductLayout />}>
          {productRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute requiredPath={route.path}>
                  {route.element}
                </ProtectedRoute>
              }
            />
          ))}
        </Route>

        <Route element={<SettingsLayout />}>
          {settingsRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute requiredPath={route.path}>
                  {route.element}
                </ProtectedRoute>
              }
            />
          ))}
        </Route>

        {/* 404 - Catch all routes không tồn tại */}
        <Route path="*" element={<MainLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter

