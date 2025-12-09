import { Outlet } from 'react-router-dom'
import TopNav from '../components/navigation/TopNav.jsx'
import Footer from '../components/navigation/Footer.jsx'

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-16 pt-10">
        <div className="rounded-3xl bg-gradient-to-br from-orange-50 via-white to-white p-8 shadow-sm ring-1 ring-orange-100">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Autopee
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Giải pháp đơn hàng Shopee: chuẩn hóa, tự động hóa, sẵn sàng mở
            rộng cho đội vận hành.
          </p>
        </div>
        <div className="mt-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout

