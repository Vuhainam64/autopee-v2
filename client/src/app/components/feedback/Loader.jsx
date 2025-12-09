import logo from '../../../assets/autopee-logo.png'

function Loader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-transparent backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-4 text-orange-600">
        <div className="rounded-2xl bg-white/70 p-4 shadow-lg backdrop-blur-sm ring-1 ring-orange-100">
          <img
            src={logo}
            alt="Autopee"
            className="h-16 w-16 animate-pulse rounded-xl bg-white p-2"
          />
        </div>
        <p className="text-sm font-semibold tracking-wide uppercase">
          Autopee đang khởi chạy...
        </p>
      </div>
    </div>
  )
}

export default Loader

