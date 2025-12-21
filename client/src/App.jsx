import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import AntdProvider from './app/providers/AntdProvider.jsx'
import { AuthProvider } from './app/contexts/AuthContext.jsx'
import { PermissionProvider } from './app/contexts/PermissionContext.jsx'
import { store } from './app/store/store.js'
import Loader from './app/components/feedback/Loader.jsx'
import AppRouter from './app/routes/AppRouter.jsx'
import UserSync from './app/components/auth/UserSync.jsx'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Provider store={store}>
      <AntdProvider>
        <AuthProvider>
          <PermissionProvider>
          <UserSync />
          {loading ? (
            <Loader />
          ) : (
            <AppRouter />
          )}
          </PermissionProvider>
        </AuthProvider>
      </AntdProvider>
    </Provider>
  )
}

export default App
