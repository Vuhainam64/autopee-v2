import { Modal } from 'antd'

const formatTimestamp = (ts) => {
  if (!ts) return 'N/A'
  const num = Number(ts)
  if (Number.isNaN(num)) return ts
  return new Date(num * 1000).toLocaleString('vi-VN')
}

function DetailModal({ open, onClose, detailType, detailData }) {
  const renderCancel = () => (
    <div className="space-y-4 text-sm text-slate-700">
      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
        <div className="font-semibold text-red-600 text-base">
          {detailData.cancellation_status?.title?.text || 'Đã hủy đơn hàng'}
        </div>
        <div className="text-red-700 mt-1">
          {detailData.cancellation_status?.msg?.text?.replace(
            '{{requested_time}}',
            formatTimestamp(detailData.cancellation_status?.msg?.attributes?.[0]?.value),
          ) || 'Đã hủy'}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-1">
        <div className="font-semibold">Thông tin hủy</div>
        {detailData.cancellation_info?.info_rows?.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-slate-500">{row.info_label?.text}:</span>
            <span>{row.info_value?.value || row.info_value?.name || 'N/A'}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-2">
        <div className="font-semibold">Sản phẩm</div>
        {detailData.order_list_card?.parcel_cards?.[0]?.product_info?.item_groups?.[0]?.items?.map(
          (item) => (
            <div key={item.item_id} className="flex items-center gap-3">
              <img
                src={`https://cf.shopee.vn/file/${item.image}`}
                alt={item.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <div>{item.name}</div>
                <div className="text-xs text-slate-500">Số lượng: {item.amount}</div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )

  const renderCheckout = () => (
    <div className="space-y-3">
      <div className="text-sm text-slate-700">
        <div>
          <span className="font-semibold">Checkout ID:</span>{' '}
          {detailData.checkout_info?.checkout_id || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Order ID:</span>{' '}
          {detailData.order_cards?.[0]?.order_info_card?.order_id || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Thanh toán:</span>{' '}
          {detailData.payment_method?.payment_channel_name?.attributes?.[0]?.value || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Tổng tiền:</span>{' '}
          {detailData.checkout_info?.total_price || 'N/A'}
        </div>
      </div>
      <div className="text-sm text-slate-700">
        <div className="font-semibold">Địa chỉ giao hàng</div>
        <div>{detailData.order_cards?.[0]?.delivery_info?.address?.shipping_name || 'N/A'}</div>
        <div>{detailData.order_cards?.[0]?.delivery_info?.address?.shipping_phone || 'N/A'}</div>
        <div>{detailData.order_cards?.[0]?.delivery_info?.address?.shipping_address || 'N/A'}</div>
      </div>
      <div className="text-sm text-slate-700">
        <div className="font-semibold">Sản phẩm</div>
        {detailData.order_cards?.[0]?.items?.map((item) => (
          <div key={item.item_id} className="flex items-center gap-3">
            <img
              src={`https://cf.shopee.vn/file/${item.image}`}
              alt={item.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div>
              <div>{item.name}</div>
              <div className="text-xs text-slate-500">Số lượng: {item.quantity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderOrderCancelled = () => (
    <div className="space-y-3 text-sm text-slate-700">
      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
        <div className="font-semibold text-red-600 text-base">
          Đơn đã hủy
        </div>
        <div className="text-red-700 mt-1">
          Hủy lúc: {formatTimestamp(detailData.header?.title?.attributes?.[0]?.value)}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-1">
        <div className="font-semibold">Thông tin đơn</div>
        <div>
          <span className="text-slate-500">Order ID:</span>{' '}
          {detailData.order_info_card?.order_id || 'N/A'}
        </div>
        <div>
          <span className="text-slate-500">Mã đơn:</span>{' '}
          {detailData.order_info_card?.order_sn || 'N/A'}
        </div>
        <div>
          <span className="text-slate-500">Thanh toán:</span>{' '}
          {detailData.order_info_card?.payment_method?.text || 'N/A'}
        </div>
        <div>
          <span className="text-slate-500">Tổng tiền:</span>{' '}
          {detailData.order_payment?.total_price || 'N/A'}
        </div>
        <div>
          <span className="text-slate-500">Đặt lúc:</span>{' '}
          {formatTimestamp(detailData.order_info_card?.order_time)}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-2">
        <div className="font-semibold">Sản phẩm</div>
        {detailData.items?.map((item) => (
          <div key={item.item_id} className="flex items-center gap-3">
            <img
              src={`https://cf.shopee.vn/file/${item.image}`}
              alt={item.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div>
              <div>{item.name}</div>
              <div className="text-xs text-slate-500">Số lượng: {item.quantity}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-1">
        <div className="font-semibold">Địa chỉ giao hàng</div>
        <div>{detailData.delivery_info?.address?.shipping_name || 'N/A'}</div>
        <div>{detailData.delivery_info?.address?.shipping_phone || 'N/A'}</div>
        <div>{detailData.delivery_info?.address?.shipping_address || 'N/A'}</div>
      </div>
    </div>
  )

  return (
    <Modal
      title="Chi tiết đơn hàng"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
    >
      {!detailData && <div className="text-sm text-slate-500">Không có dữ liệu</div>}
      {detailData && (
        detailType === 'cancel'
          ? renderOrderCancelled()
          : renderCheckout()
      )}
    </Modal>
  )
}

export default DetailModal


