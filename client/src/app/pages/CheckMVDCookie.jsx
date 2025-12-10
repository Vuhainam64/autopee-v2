import { useState } from 'react'
import { Button, App } from 'antd'
import { MdCookie } from 'react-icons/md'
import {
  getOrderDetailsForCookie,
  getCheckoutDetail,
  getCancelledOrderDetail,
} from '../services/shopeeApi.js'
import ManualCookieModal from './checkMVD/ManualCookieModal.jsx'
import OrdersTable from './checkMVD/OrdersTable.jsx'
import DetailModal from './checkMVD/DetailModal.jsx'

function CheckMVDCookie() {
  const [isManualCookieVisible, setIsManualCookieVisible] = useState(false)
  const [manualCookies, setManualCookies] = useState('')
  const [orderDetails, setOrderDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailType, setDetailType] = useState('checkout') // 'checkout' | 'cancel'
  const { message: messageApi } = App.useApp()

  const openManualCookiePopup = () => {
    setIsManualCookieVisible(true)
  }

  const closeManualCookiePopup = () => {
    setIsManualCookieVisible(false)
    setManualCookies('')
  }

  const fetchOrderDetails = async (cookiesArray) => {
    try {
      setLoading(true)
      const response = await getOrderDetailsForCookie(cookiesArray)
      
      if (response.success && response.data?.allOrderDetails) {
        const newOrders = []

        const mapEntry = (entry, cookie) => {
          const orderId =
            entry?.info_card?.order_id ||
            entry?.info_card?.checkout_id ||
            entry?.order_id ||
            entry?.checkout_id ||
            ''

          const trackingDesc =
            entry?.shipping?.tracking_info?.description ||
            entry?.status?.list_view_status_label?.text ||
            entry?.status?.status_label?.text ||
            ''

          const shopName =
            entry?.info_card?.order_list_cards?.[0]?.shop_info?.shop_name || ''

          // Try to pick the first item (parcel_cards or product_info)
          const itemFromParcel =
            entry?.info_card?.order_list_cards?.[0]?.parcel_cards?.[0]
              ?.product_info?.item_groups?.[0]?.items?.[0]

          const itemFromProductInfo =
            entry?.info_card?.order_list_cards?.[0]?.product_info?.item_groups?.[0]
              ?.items?.[0]

          const item = itemFromParcel || itemFromProductInfo

          const productName = item?.name || ''
          const productImage = item?.image

          return {
            order_id: orderId || 'N/A',
            tracking_number: orderId || 'N/A',
            tracking_info_description: trackingDesc || 'N/A',
            address: {
              shipping_name: shopName || 'N/A',
            },
            product_info: item
              ? [
                  {
                    name: productName,
                    image: productImage,
                  },
                ]
              : [],
            cookie,
            checkout_id:
              entry?.info_card?.checkout_id ||
              entry?.checkout_id ||
              null,
            status_text:
              entry?.status?.list_view_status_label?.text ||
              entry?.status?.status_label?.text ||
              '',
            list_type: entry?.list_type,
          }
        }

        response.data.allOrderDetails.forEach((orderBlock) => {
          if (orderBlock?.error) {
            newOrders.push({
              order_id: 'Error',
              tracking_number: 'Error',
              tracking_info_description: orderBlock.error,
              address: {
                shipping_name: 'Error',
                shipping_phone: '',
                shipping_address: 'Error',
              },
              cookie: orderBlock.cookie,
              noOrder: true,
            })
            return
          }

          if (orderBlock?.orderData && Array.isArray(orderBlock.orderData)) {
            orderBlock.orderData.forEach((entry) => {
              newOrders.push(mapEntry(entry, orderBlock.cookie))
            })
          }

          if (orderBlock?.checkoutData && Array.isArray(orderBlock.checkoutData)) {
            orderBlock.checkoutData.forEach((entry) => {
              newOrders.push(mapEntry(entry, orderBlock.cookie))
            })
          }
        })

        setOrderDetails((prevOrders) => [...prevOrders, ...newOrders])
        messageApi.success(`Đã tải ${newOrders.length} đơn hàng`)
      } else {
        messageApi.error('Không thể lấy thông tin đơn hàng')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      messageApi.error('Lỗi khi lấy chi tiết đơn hàng: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const submitManualCookies = async () => {
    const cookiesArray = manualCookies
      .split('\n')
      .map((cookie) => cookie.trim())
      .filter((cookie) => cookie !== '')

    if (cookiesArray.length === 0) {
      messageApi.warning('Vui lòng nhập ít nhất một cookie')
      return
    }

    await fetchOrderDetails(cookiesArray)
    closeManualCookiePopup()
  }

  const handleViewDetail = async (record) => {
    try {
      setDetailLoading(true)
      let resp

      const statusText = record.status_text || ''
      const isCancelled = statusText.includes('label_cancel')

      if (isCancelled && record.order_id) {
        setDetailType('cancel')
        resp = await getCancelledOrderDetail({
          cookie: record.cookie,
          orderId: record.order_id,
        })
      } else if (record.checkout_id) {
        setDetailType('checkout')
        resp = await getCheckoutDetail({
          cookie: record.cookie,
          checkoutId: record.checkout_id,
        })
      } else {
        messageApi.warning('Không tìm thấy checkout_id/order_id để xem chi tiết')
        return
      }

      if (resp?.success && resp.data) {
        setDetailData(resp.data)
        setDetailModalVisible(true)
      } else {
        messageApi.error('Không lấy được chi tiết đơn hàng')
      }
    } catch (error) {
      messageApi.error('Lỗi khi lấy chi tiết đơn hàng')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">checkMVDCookie</h2>
          <p className="text-sm text-slate-600">
            Trang kiểm tra MVD Cookie. Nhập cookie để xem danh sách đơn hàng.
          </p>
        </div>
        <Button
          type="default"
          className="bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
          onClick={openManualCookiePopup}
        >
          <div className="flex items-center justify-between space-x-2">
            <MdCookie />
            <div>Nhập Cookie</div>
          </div>
        </Button>
      </div>

      {/* Modal Nhập Cookie Thủ Công */}
      <ManualCookieModal
        open={isManualCookieVisible}
        onCancel={closeManualCookiePopup}
        onSubmit={submitManualCookies}
        loading={loading}
        manualCookies={manualCookies}
        setManualCookies={setManualCookies}
      />

      {/* Bảng danh sách đơn hàng */}
      <OrdersTable
        data={orderDetails}
        loading={loading}
        detailLoading={detailLoading}
        onViewDetail={handleViewDetail}
        onRemoveCookie={(cookie) => {
          setOrderDetails((prev) => prev.filter((item) => item.cookie !== cookie))
          messageApi.success('Đã xóa mục theo cookie')
        }}
      />

      <DetailModal
        open={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        detailType={detailType}
        detailData={detailData}
      />
    </div>
  )
}

export default CheckMVDCookie

