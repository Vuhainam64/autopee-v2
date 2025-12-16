import { Modal, Image } from 'antd'

function OrderDetailModal({ open, loading, data, onClose, formatPrice, formatTime }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Chi tiết đơn hàng"
      width={720}
    >
      {loading && <div className="text-sm text-slate-600">Đang tải...</div>}
      {!loading && data && (
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 space-y-1">
            <div className="font-semibold text-emerald-700">
              {data?.shipping_info?.parcels?.[0]?.title?.text || 'Thông tin vận chuyển'}
            </div>
            <div className="text-slate-600">
              SPX Express · {data?.shipping_info?.parcels?.[0]?.tracking_number || 'N/A'}
            </div>
            <div className="text-slate-600">
              {data?.shipping_info?.parcels?.[0]?.msg?.text || 'Trạng thái không xác định'}
            </div>
            <div className="text-slate-500">
              {formatTime(data?.shipping_info?.parcels?.[0]?.latest_tracking_info?.ctime)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 space-y-1">
            <div className="font-semibold">Địa chỉ nhận hàng</div>
            <div className="text-slate-800">
              {data?.delivery_info?.address?.shipping_name || 'N/A'} -{' '}
              {data?.delivery_info?.address?.shipping_phone || 'N/A'}
            </div>
            <div className="text-slate-700">
              {data?.delivery_info?.address?.shipping_address || 'N/A'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 space-y-1">
            <div className="font-semibold">Thông tin đơn</div>
            <div>Mã đơn: {data?.order_info_card?.order_sn || 'N/A'}</div>
            <div>Order ID: {data?.order_info_card?.order_id || 'N/A'}</div>
            <div>Thanh toán: {data?.order_info_card?.payment_method?.text || 'N/A'}</div>
            <div>Thời gian đặt: {formatTime(data?.order_info_card?.order_time)}</div>
            <div>Hoàn tất: {formatTime(data?.order_info_card?.complete_time)}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 space-y-2">
            <div className="font-semibold">Sản phẩm</div>
            {data?.items?.map((it) => (
              <div key={it.item_id} className="flex items-center gap-3">
                <Image
                  width={56}
                  height={56}
                  src={`https://cf.shopee.vn/file/${it.image}`}
                  alt={it.name}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                  preview
                />
                <div>
                  <div>{it.name}</div>
                  <div className="text-xs text-slate-500">Số lượng: {it.quantity}</div>
                  <div className="text-xs text-slate-500">Giá: {formatPrice(it.price)}</div>
                </div>
              </div>
            )) || <div className="text-slate-500">N/A</div>}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 space-y-1">
            <div className="font-semibold">Tổng tiền</div>
            <div>Hàng hóa: {formatPrice(data?.order_payment?.price_breakdown?.[0]?.info_value?.value)}</div>
            <div>Vận chuyển: {formatPrice(data?.order_payment?.price_breakdown?.[1]?.info_value?.value)}</div>
            <div className="font-semibold text-slate-900">
              Thành tiền: {formatPrice(data?.order_payment?.total_price)}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default OrderDetailModal

