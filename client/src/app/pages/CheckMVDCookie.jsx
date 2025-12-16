import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Modal, Tabs, Input, Space, Table, Tag, Typography, Upload, App } from 'antd'
import { MdCookie } from 'react-icons/md'
import {
  getAllOrdersAndCheckouts,
  getOrderDetail,
  genShopeeQR,
  checkShopeeQR,
  loginShopeeQR,
} from '../services/shopeeApi.js'
import QrSection from './checkMVD/QrSection.jsx'
import OrderDetailModal from './checkMVD/OrderDetailModal.jsx'

const { TextArea } = Input
const { Text } = Typography

const extractFirstItem = (entry) => {
  const parcelItem =
    entry?.info_card?.order_list_cards?.[0]?.parcel_cards?.[0]?.product_info?.item_groups?.[0]
      ?.items?.[0]
  const productItem =
    entry?.info_card?.order_list_cards?.[0]?.product_info?.item_groups?.[0]?.items?.[0]
  return parcelItem || productItem || null
}

const mapOrders = (details) =>
  (details || []).map((entry, idx) => {
    const item = extractFirstItem(entry)
    const parcel = entry?.info_card?.order_list_cards?.[0]?.parcel_cards?.[0]
    const trackingNumber =
      parcel?.tracking_number ||
      parcel?.latest_tracking_info?.tracking_number ||
      entry?.shipping?.tracking_info?.tracking_number ||
      ''
    return {
      key: entry?.info_card?.order_id || `order-${idx}`,
      index: idx + 1,
      orderId: entry?.info_card?.order_id,
      checkoutId: entry?.info_card?.checkout_id,
      trackingNumber,
      status: entry?.status?.list_view_status_label?.text || entry?.status?.status_label?.text,
      product: item?.name,
      image: item?.image,
      listType: entry?.list_type,
      _raw: entry,
    }
  })

const mapCheckouts = (details) =>
  (details || []).map((entry, idx) => {
    const item = extractFirstItem(entry)
    const parcel = entry?.info_card?.order_list_cards?.[0]?.parcel_cards?.[0]
    const trackingNumber =
      parcel?.tracking_number ||
      parcel?.latest_tracking_info?.tracking_number ||
      entry?.shipping?.tracking_info?.tracking_number ||
      ''
    return {
      key: entry?.info_card?.checkout_id || `checkout-${idx}`,
      index: idx + 1,
      checkoutId: entry?.info_card?.checkout_id,
      orderId: entry?.info_card?.order_id,
      trackingNumber,
      status: entry?.status?.list_view_status_label?.text || entry?.status?.status_label?.text,
      product: item?.name,
      image: item?.image,
      listType: entry?.list_type,
      _raw: entry,
    }
  })

function CheckMVDCookie() {
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [cookieText, setCookieText] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [checkouts, setCheckouts] = useState([])
  const [activeCookie, setActiveCookie] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrId, setQrId] = useState('')
  const [qrToken, setQrToken] = useState('')
  const qrIntervalRef = useRef(null)
  const qrStartRef = useRef(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0)
  const qrIdRef = useRef('')

  const columnsOrders = useMemo(() => {
    const statusFilters = Array.from(new Set(orders.map((o) => o.status).filter(Boolean))).map(
      (s) => ({ text: s, value: s }),
    )
    return [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        width: 60,
      },
      {
        title: 'Mã vận đơn',
        dataIndex: 'trackingNumber',
        key: 'trackingNumber',
        width: 180,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        filters: statusFilters,
        onFilter: (value, record) => record.status === value,
        render: (text) => (text ? <Tag color="blue">{text}</Tag> : 'N/A'),
      },
      { title: 'Sản phẩm', dataIndex: 'product', key: 'product' },
    ]
  }, [orders])

  const columnsCheckouts = useMemo(() => {
    const statusFilters = Array.from(new Set(checkouts.map((o) => o.status).filter(Boolean))).map(
      (s) => ({ text: s, value: s }),
    )
    return [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        width: 60,
      },
      {
        title: 'Mã vận đơn',
        dataIndex: 'trackingNumber',
        key: 'trackingNumber',
        width: 180,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        filters: statusFilters,
        onFilter: (value, record) => record.status === value,
        render: (text) => (text ? <Tag color="green">{text}</Tag> : 'N/A'),
      },
      { title: 'Sản phẩm', dataIndex: 'product', key: 'product' },
    ]
  }, [checkouts])

  const parseCookies = () =>
    cookieText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean)

  const formatPrice = (v) => {
    if (v === undefined || v === null) return 'N/A'
    const num = Number(v)
    if (Number.isNaN(num)) return v
    const adjusted = num / 100000 // Shopee trả dư 5 số 0 (chia thêm để về đơn vị VND)
    return adjusted.toLocaleString('vi-VN')
  }

  const formatTime = (ts) => {
    if (!ts) return 'N/A'
    const num = Number(ts)
    if (Number.isNaN(num)) return ts
    return new Date(num * 1000).toLocaleString('vi-VN')
  }

  const fetchData = async (cookiesArr) => {
    // Use first cookie for now; extend to multi later.
    const cookie = cookiesArr[0]
    if (!cookie) {
      message.warning('Vui lòng nhập ít nhất một cookie')
      return
    }
    setActiveCookie(cookie)

    try {
      setLoading(true)
      const resp = await getAllOrdersAndCheckouts({ cookie, limit: 10, list_type: 7, offset: 0 })

      if (!resp?.success) {
        throw new Error(resp?.error?.message || 'Shopee API trả về lỗi')
      }

      const orderList = resp.data?.order_data?.details_list || []
      const checkoutList = resp.data?.checkout_data?.details_list || []

      let mappedOrders = mapOrders(orderList)
      let mappedCheckouts = mapCheckouts(checkoutList)

      // Enrich tracking numbers via order detail v2 (best-effort)
      const uniqueOrderIds = Array.from(
        new Set([
          ...mappedOrders.map((o) => o.orderId).filter(Boolean).map((x) => String(x)),
          ...mappedCheckouts.map((c) => c.orderId).filter(Boolean).map((x) => String(x)),
        ]),
      )

      const detailResults = await Promise.all(
        uniqueOrderIds.map(async (oid) => {
          try {
            const detail = await getOrderDetail({ cookie, orderId: oid })
            if (detail?.success && detail.data) {
              return { orderId: oid, detail: detail.data }
            }
          } catch (e) {
            // ignore individual errors
          }
          return null
        }),
      )

      const detailMap = new Map()
      detailResults.forEach((r) => {
        if (r?.orderId && r.detail) detailMap.set(String(r.orderId), r.detail)
      })

      const pickTracking = (detail, fallback) => {
        const tn =
          detail?.shipping_info?.parcels?.[0]?.tracking_number ||
          detail?.shipping_info?.parcels?.[0]?.latest_tracking_info?.tracking_number ||
          fallback
        return tn || fallback
      }

      mappedOrders = mappedOrders.map((o) => {
        const d = detailMap.get(String(o.orderId))
        if (!d) return o
        return {
          ...o,
          trackingNumber: pickTracking(d, o.trackingNumber),
        }
      })

      mappedCheckouts = mappedCheckouts.map((c) => {
        const d = detailMap.get(String(c.orderId))
        if (!d) return c
        return {
          ...c,
          trackingNumber: pickTracking(d, c.trackingNumber),
        }
      })

      setOrders(mappedOrders)
      setCheckouts(mappedCheckouts)
      message.success(`Tải thành công ${orderList.length} orders, ${checkoutList.length} checkouts`)
    } catch (err) {
      console.error(err)
      message.error(`Lỗi tải dữ liệu: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRowDetail = async (orderId) => {
    if (!orderId) {
      message.warning('Không có order_id để lấy chi tiết')
      return
    }
    if (!activeCookie) {
      message.warning('Vui lòng nhập cookie trước')
      return
    }
    try {
      setDetailLoading(true)
      const resp = await getOrderDetail({ cookie: activeCookie, orderId: orderId })
      if (resp?.success && resp.data) {
        setDetailData(resp.data)
        setDetailOpen(true)
      } else {
        message.error('Không lấy được chi tiết đơn hàng')
      }
    } catch (err) {
      message.error(`Lỗi lấy chi tiết: ${err.message || 'Unknown'}`)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmitCookies = async () => {
    const cookiesArr = parseCookies()
    await fetchData(cookiesArr)
    setModalOpen(false)
  }

  const handleGenQR = async () => {
    try {
      setQrLoading(true)
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current)
        qrIntervalRef.current = null
      }
      const resp = await genShopeeQR()
      if (resp?.success && resp.data) {
        // Shopee trả qrcode base64 và qrcode_id
        const newQrId = resp.data.qrcode_id || resp.data.qrcode_id_new || ''
        setQrId(newQrId)
        qrIdRef.current = newQrId
        setQrImage(resp.data.qrcode_base64 || resp.data.qrcode || '')
        setQrToken('') // reset
        console.log('QR created, start polling status...')
        message.success('Đã tạo QR, quét bằng app Shopee')
        qrStartRef.current = Date.now()
        setQrSecondsLeft(60)
        // chạy lần đầu sau 1s cho chắc chắn có qrcode_id
        setTimeout(() => {
          handleCheckQR(qrIdRef.current, true)
        }, 1000)
        qrIntervalRef.current = setInterval(() => {
          console.log('QR polling tick...')
          const elapsed = Date.now() - (qrStartRef.current || 0)
          if (elapsed >= 60000) {
            clearInterval(qrIntervalRef.current)
            qrIntervalRef.current = null
            setQrId('')
            setQrImage('')
            setQrToken('')
            setQrSecondsLeft(0)
            message.warning('QR hết hạn sau 60s, vui lòng tạo lại')
            return
          }
          setQrSecondsLeft(Math.max(0, 60 - Math.floor(elapsed / 1000)))
          handleCheckQR(qrIdRef.current, true)
        }, 5000)
      } else {
        message.error('Không tạo được QR')
      }
    } catch (err) {
      message.error(`Lỗi tạo QR: ${err.message || 'Unknown'}`)
    } finally {
      setQrLoading(false)
    }
  }

  const handleCheckQR = async (qrIdOverride, silent = false) => {
    const idToCheck = qrIdOverride || qrIdRef.current || qrId
    if (!idToCheck) {
      if (!silent) message.warning('Chưa có QR để kiểm tra')
      return
    }
    try {
      // log để thấy có chạy interval
      console.log('Checking QR status...', idToCheck)
      const resp = await checkShopeeQR(idToCheck)
      const token =
        resp?.data?.data?.qrcode_token ||
        resp?.data?.qrcode_token ||
        resp?.data?.data?.qrcode?.qrcode_token ||
        ''
      if (token) {
        setQrToken(token)
        console.log('QR scanned, got token, proceeding login')
        if (!silent) message.success('Đã quét, đang đăng nhập...')
        if (qrIntervalRef.current) {
          clearInterval(qrIntervalRef.current)
          qrIntervalRef.current = null
        }
        setQrSecondsLeft(0)
        await handleLoginQR(token)
      } else {
        if (!silent) message.info('Chưa quét hoặc chưa xác nhận, thử lại sau vài giây')
      }
    } catch (err) {
      message.error(`Lỗi kiểm tra QR: ${err.message || 'Unknown'}`)
    }
  }

  const handleLoginQR = async (tokenParam) => {
    const token = tokenParam || qrToken
    if (!token) {
      message.warning('Chưa có qrcode_token')
      return
    }
    try {
      const resp = await loginShopeeQR(token)
      if (resp?.success && resp.data?.cookie) {
        const cookie = resp.data.cookie
        setCookieText(cookie)
        setActiveCookie(cookie)
        message.success('Đăng nhập QR thành công, đang tải đơn hàng')
        await fetchData([cookie])
        setModalOpen(false)
        if (qrIntervalRef.current) {
          clearInterval(qrIntervalRef.current)
          qrIntervalRef.current = null
        }
      } else {
        message.error('Đăng nhập QR thất bại')
      }
    } catch (err) {
      message.error(`Lỗi đăng nhập QR: ${err.message || 'Unknown'}`)
    }
  }

  // cleanup QR polling on unmount
  useEffect(() => {
    return () => {
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current)
        qrIntervalRef.current = null
      }
      setQrSecondsLeft(0)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Check MVD Cookie</h2>
          <p className="text-sm text-slate-600">
            Nhập cookie để lấy danh sách đơn hàng và checkout từ Shopee.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button danger onClick={() => {
            setOrders([])
            setCheckouts([])
            message.success('Đã xóa toàn bộ dữ liệu')
          }}>
            Xóa tất cả
          </Button>
          <Button
            type="default"
            className="bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
            onClick={() => setModalOpen(true)}
          >
            <div className="flex items-center justify-between space-x-2">
              <MdCookie />
              <div>Nhập Cookie</div>
            </div>
          </Button>
        </div>
      </div>

      <Space direction="vertical" className="w-full">
        <div className="rounded-lg border border-slate-200 p-3 bg-white">
          <div className="font-semibold mb-2">Orders</div>
          <Table
            loading={loading}
            dataSource={orders}
            columns={columnsOrders}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
            onRow={(record) => ({
              onClick: () => handleRowDetail(record.orderId),
            })}
          />
        </div>

        <div className="rounded-lg border border-slate-200 p-3 bg-white">
          <div className="font-semibold mb-2">Checkouts</div>
          <Table
            loading={loading}
            dataSource={checkouts}
            columns={columnsCheckouts}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
            onRow={(record) => ({
              onClick: () => handleRowDetail(record.orderId),
            })}
          />
        </div>
      </Space>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitCookies}
        okText="Xác nhận"
        cancelText="Hủy"
        width={720}
        title="Nhập Cookie"
      >
        <Tabs
          defaultActiveKey="text"
          items={[
            {
              key: 'file',
              label: 'File',
              children: (
                <div className="space-y-2">
                  <Text type="secondary">Tải file chứa cookie (chưa triển khai, placeholder).</Text>
                  <Upload beforeUpload={() => false}>
                    <Button>Tải file</Button>
                  </Upload>
                </div>
              ),
            },
            {
              key: 'qr',
              label: 'Quét QR',
              children: (
                <QrSection
                  qrImage={qrImage}
                  qrLoading={qrLoading}
                  onGen={handleGenQR}
                  polling={{ isRunning: Boolean(qrIntervalRef.current), seconds: qrSecondsLeft }}
                />
              ),
            },
            {
              key: 'text',
              label: 'Dán cookie',
              children: (
                <div className="space-y-2">
                  <Text>Nhập cookie, mỗi dòng một cookie:</Text>
                  <TextArea
                    rows={6}
                    placeholder="Dán cookie vào đây, mỗi dòng một cookie"
                    value={cookieText}
                    onChange={(e) => setCookieText(e.target.value)}
                  />
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <OrderDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={detailData}
        onClose={() => setDetailOpen(false)}
        formatPrice={formatPrice}
        formatTime={formatTime}
      />
    </div>
  )
}

export default CheckMVDCookie