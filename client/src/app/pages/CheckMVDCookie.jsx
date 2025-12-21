import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Modal, Tabs, Input, Space, Table, Tag, Typography, Upload, App, Progress, Alert, Spin } from 'antd'
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
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' })
  const [failedCookies, setFailedCookies] = useState([])
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
    if (!cookiesArr || cookiesArr.length === 0) {
      message.warning('Vui lòng nhập ít nhất một cookie')
      return
    }

    setLoading(true)
    setFailedCookies([])
    setLoadingProgress({ current: 0, total: cookiesArr.length, message: 'Đang khởi tạo...' })
    let allOrders = []
    let allCheckouts = []
    let successCount = 0
    let failCount = 0
    const cookieResults = []
    const failedCookiesList = []
    let completedCount = 0

    // Xử lý tất cả cookies song song
    const promises = cookiesArr.map(async (cookie, index) => {
      try {
        setLoadingProgress((prev) => ({
          current: prev.current + 1,
          total: cookiesArr.length,
          message: `Đang xử lý cookie ${index + 1}/${cookiesArr.length}...`
        }))
        setActiveCookie(`Đang xử lý cookie ${index + 1}/${cookiesArr.length}...`)
        
      const resp = await getAllOrdersAndCheckouts({ cookie, limit: 10, list_type: 7, offset: 0 })

      if (!resp?.success) {
        throw new Error(resp?.error?.message || 'Shopee API trả về lỗi')
      }

      const orderList = resp.data?.order_data?.details_list || []
      const checkoutList = resp.data?.checkout_data?.details_list || []

        cookieResults.push({
          cookieIndex: index + 1,
          cookie: cookie.substring(0, 30) + '...',
          success: true,
          orders: orderList.length,
          checkouts: checkoutList.length,
        })

        return {
          cookie,
          orders: orderList,
          checkouts: checkoutList,
        }
      } catch (error) {
        console.error(`Cookie ${index + 1} failed:`, error.message)
        const failedCookie = {
          index: index + 1,
          cookie: cookie.substring(0, 50) + '...',
          error: error.message,
        }
        failedCookiesList.push(failedCookie)
        cookieResults.push({
          cookieIndex: index + 1,
          cookie: cookie.substring(0, 30) + '...',
          success: false,
          error: error.message,
        })
        return null
      }
    })

    setLoadingProgress({ 
      current: cookiesArr.length, 
      total: cookiesArr.length, 
      message: 'Đang gộp kết quả...' 
    })
    const results = await Promise.all(promises)

    // Gộp tất cả kết quả lại
    results.forEach((result) => {
      if (result) {
        allOrders.push(...result.orders)
        allCheckouts.push(...result.checkouts)
        successCount++
      } else {
        failCount++
      }
    })

    if (successCount === 0) {
      setLoading(false)
      setFailedCookies(failedCookiesList)
      message.error(`Tất cả ${cookiesArr.length} cookie đều không hợp lệ`)
      return
    }

    // Lưu danh sách cookie bị lỗi
    setFailedCookies(failedCookiesList)

    // Lưu danh sách cookie bị lỗi
    setFailedCookies(failedCookiesList)

    // Map orders và checkouts
    let mappedOrders = mapOrders(allOrders)
    let mappedCheckouts = mapCheckouts(allCheckouts)

    // Lấy danh sách cookie thành công để dùng cho order detail
    const successCookies = results.filter((r) => r !== null).map((r) => r.cookie)

      // Enrich tracking numbers via order detail v2 (best-effort)
      const uniqueOrderIds = Array.from(
        new Set([
          ...mappedOrders.map((o) => o.orderId).filter(Boolean).map((x) => String(x)),
          ...mappedCheckouts.map((c) => c.orderId).filter(Boolean).map((x) => String(x)),
        ]),
      )

    setLoadingProgress({ 
      current: cookiesArr.length, 
      total: cookiesArr.length, 
      message: `Đang lấy chi tiết đơn hàng (${uniqueOrderIds.length} đơn)...` 
    })

    // Thử lấy detail với cookie đầu tiên thành công
      const detailResults = await Promise.all(
        uniqueOrderIds.map(async (oid) => {
        for (const cookie of successCookies) {
          try {
            const detail = await getOrderDetail({ cookie, orderId: oid })
            if (detail?.success && detail.data) {
              return { orderId: oid, detail: detail.data }
            }
          } catch (e) {
            // Thử cookie tiếp theo
            continue
          }
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
    setActiveCookie(`Đã xử lý ${successCount}/${cookiesArr.length} cookie thành công`)
    setLoadingProgress({ current: cookiesArr.length, total: cookiesArr.length, message: 'Hoàn thành!' })

    if (failCount > 0) {
      message.warning(`Thành công: ${successCount} cookie, Thất bại: ${failCount} cookie. Tổng: ${mappedOrders.length} orders, ${mappedCheckouts.length} checkouts`)
    } else {
      message.success(`Tải thành công từ ${successCount} cookie. Tổng: ${mappedOrders.length} orders, ${mappedCheckouts.length} checkouts`)
    }
      setLoading(false)
      // Reset progress sau 1 giây
      setTimeout(() => {
        setLoadingProgress({ current: 0, total: 0, message: '' })
      }, 1000)
  }

  const handleRowDetail = async (orderId) => {
    if (!orderId) {
      message.warning('Không có order_id để lấy chi tiết')
      return
    }
    
    // Thử tất cả cookies đã nhập
    const cookiesArr = parseCookies()
    if (cookiesArr.length === 0) {
      message.warning('Vui lòng nhập cookie trước')
      return
    }

    try {
      setDetailLoading(true)
      
      // Thử từng cookie cho đến khi thành công
      let success = false
      for (const cookie of cookiesArr) {
        try {
          const resp = await getOrderDetail({ cookie, orderId: orderId })
      if (resp?.success && resp.data) {
        setDetailData(resp.data)
        setDetailOpen(true)
            success = true
            break
          }
        } catch (e) {
          // Thử cookie tiếp theo
          continue
        }
      }
      
      if (!success) {
        message.error('Không lấy được chi tiết đơn hàng từ bất kỳ cookie nào')
      }
    } catch (err) {
      message.error(`Lỗi lấy chi tiết: ${err.message || 'Unknown'}`)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmitCookies = async () => {
    const cookiesArr = parseCookies()
    if (cookiesArr.length === 0) {
      message.warning('Vui lòng nhập ít nhất một cookie')
      return
    }

    // Lưu tất cả cookies vào database (nếu có authentication)
    try {
      const { post } = await import('../services/api.js')
      for (const cookie of cookiesArr) {
        try {
          // Gọi API để lưu cookie (API sẽ tự động lưu nếu có token)
          await post('/shopee/orders', { cookie, limit: 1, list_type: 7, offset: 0 })
        } catch (error) {
          // Bỏ qua lỗi nếu không có authentication, chỉ log
          console.log('Could not save cookie (may need authentication):', error.message)
        }
      }
    } catch (error) {
      console.log('Error saving cookies:', error)
    }

    // Đóng modal ngay lập tức
    setModalOpen(false)

    await fetchData(cookiesArr)
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

      {loading && loadingProgress.total > 0 && (
        <Alert
          message={
            <div className="space-y-2">
              <div className="font-semibold">{loadingProgress.message}</div>
              <Progress 
                percent={Math.round((loadingProgress.current / loadingProgress.total) * 100)} 
                status="active"
                format={() => `${loadingProgress.current}/${loadingProgress.total}`}
              />
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {failedCookies.length > 0 && (
        <Alert
          message={
            <div className="space-y-2">
              <div className="font-semibold text-red-600">Cookie bị lỗi ({failedCookies.length}):</div>
              <div className="space-y-1">
                {failedCookies.map((fc, idx) => (
                  <div key={idx} className="text-red-500 text-sm">
                    Cookie {fc.index}: <span className="font-mono">{fc.cookie}</span> - <span className="text-red-600 font-bold">Cookie die</span>
                  </div>
                ))}
              </div>
            </div>
          }
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <Space direction="vertical" className="w-full">
        <div className="rounded-lg border border-slate-200 p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Orders</div>
            <Text type="secondary" className="text-xs">💡 Nhấp vào dòng để xem chi tiết đơn hàng</Text>
          </div>
          <Table
            loading={loading}
            dataSource={orders}
            columns={columnsOrders}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
            onRow={(record) => ({
              onClick: () => handleRowDetail(record.orderId),
              style: { cursor: 'pointer' },
            })}
          />
        </div>

        <div className="rounded-lg border border-slate-200 p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Checkouts</div>
            <Text type="secondary" className="text-xs">💡 Nhấp vào dòng để xem chi tiết đơn hàng</Text>
          </div>
          <Table
            loading={loading}
            dataSource={checkouts}
            columns={columnsCheckouts}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
            onRow={(record) => ({
              onClick: () => handleRowDetail(record.orderId || record.checkoutId),
              style: { cursor: 'pointer' },
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
                  <Text className="text-xs text-slate-500 block mb-2">
                    Hệ thống sẽ thử từng cookie cho đến khi tìm thấy cookie hợp lệ
                  </Text>
                  <TextArea
                    rows={8}
                    placeholder="SPC_ST=..."
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