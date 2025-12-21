import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from '../components/navigation/TopNav.jsx'
import Footer from '../components/navigation/Footer.jsx'
import SideNav from '../components/navigation/SideNav.jsx'

function ProductLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-8 px-4 lg:px-6 pb-16 pt-10">
        {/* Sidebar - Fixed */}
        <aside className="sticky top-[calc(4rem+2.5rem)] h-[calc(100vh-8rem)] shrink-0">
          <SideNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </aside>
        {/* Main Content - Scrollable */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default ProductLayout

