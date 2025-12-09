function NotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
        404
      </p>
      <h2 className="text-2xl font-semibold text-slate-900">
        Không tìm thấy trang
      </h2>
      <p className="max-w-md text-sm text-slate-600">
        Đường dẫn bạn truy cập không tồn tại. Về trang chủ để tiếp tục quản lý
        đơn hàng Shopee.
      </p>
      <a
        href="/"
        className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
      >
        Về trang chủ
      </a>
    </div>
  )
}

export default NotFound

