import { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  Tag,
  Alert
} from 'antd'
import { KeyOutlined, ThunderboltOutlined, MessageOutlined } from '@ant-design/icons'
import { get, post } from '../../../services/api.js'
import ViotpKeyManagerModal from './ViotpKeyManagerModal.jsx'

const { Title, Text } = Typography

const DEFAULT_SERVICE_ID = 4 // Shopee
const DEFAULT_QUANTITY = 5
const DEFAULT_MAX_ATTEMPTS_MULTIPLIER = 5

// Mapping country -> valid networks
const COUNTRY_NETWORKS = {
  vn: ['MOBIFONE', 'VINAPHONE', 'VIETTEL', 'VIETNAMOBILE', 'ITELECOM', 'WINTEL'],
  la: ['UNITEL', 'ETL', 'BEELINE', 'LAOTEL'],
}

export default function ViotpServiceTab() {
  const { message } = App.useApp()

  const [keyManagerOpen, setKeyManagerOpen] = useState(false)
  const [keys, setKeys] = useState([])
  const [selectedKeyId, setSelectedKeyId] = useState(null)

  const [networksLoading, setNetworksLoading] = useState(false)
  const [networks, setNetworks] = useState([])
  const [selectedNetworks, setSelectedNetworks] = useState([])

  const [serviceId, setServiceId] = useState(DEFAULT_SERVICE_ID)
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY)
  const [maxAttemptsMultiplier, setMaxAttemptsMultiplier] = useState(DEFAULT_MAX_ATTEMPTS_MULTIPLIER)
  const [country, setCountry] = useState('vn')

  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const [creating, setCreating] = useState(false)

  const [rows, setRows] = useState([]) // only phones not registered
  const [history, setHistory] = useState([])

  const loadKeys = async () => {
    try {
      const res = await get('/viotp/keys')
      if (res?.success) {
        const items = res.data.items || []
        setKeys(items)
        if (!selectedKeyId && items.length) setSelectedKeyId(items[0]._id)
      }
    } catch {
      // handled by global auth
    }
  }

  const fetchBalance = async (keyId) => {
    if (!keyId) {
      setBalance(null)
      return
    }
    try {
      setBalanceLoading(true)
      const res = await get(`/viotp/balance?keyId=${encodeURIComponent(keyId)}`)
      if (res?.success) {
        // server returns { data: { balance, raw } }
        setBalance(res.data?.balance ?? res.data?.data?.balance ?? 0)
      } else {
        setBalance(null)
      }
    } catch {
      setBalance(null)
    } finally {
      setBalanceLoading(false)
    }
  }

  const loadNetworks = async (keyId) => {
    if (!keyId) return
    try {
      setNetworksLoading(true)
      const res = await get(`/viotp/networks?keyId=${encodeURIComponent(keyId)}`)
      if (res?.success) {
        const items = res.data?.data || res.data // depending response
        const list = Array.isArray(items?.data) ? items.data : items?.data || items
        // VIOTP response: {status_code, success, message, data:[...]}
        const networksArr = Array.isArray(items?.data) ? items.data : Array.isArray(items) ? items : []
        setNetworks(networksArr)
        
        // Filter networks by country and select valid ones
        const validNetworks = COUNTRY_NETWORKS[country] || []
        const filteredNetworks = networksArr.filter(n => validNetworks.includes(n.name))
        setSelectedNetworks(filteredNetworks.map((n) => n.name))
      } else {
        message.error(res?.error?.message || 'Không thể tải danh sách network')
      }
    } catch (e) {
      message.error(e?.message || 'Không thể tải danh sách network')
    } finally {
      setNetworksLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedKeyId) {
      loadNetworks(selectedKeyId)
      fetchBalance(selectedKeyId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeyId])

  const keyOptions = useMemo(
    () => keys.map((k) => ({ value: k._id, label: k.name })),
    [keys],
  )

  const networkOptions = useMemo(
    () => networks.map((n) => ({ value: n.name, label: `${n.name}` })),
    [networks],
  )

  // per-row OTP loading state
  const [otpLoading, setOtpLoading] = useState({})

  const getOtp = (record) => {
    const { requestId, phone } = record
    if (otpLoading[requestId]) return // already polling

    setOtpLoading((prev) => ({ ...prev, [requestId]: true }))

    const start = Date.now()

    const fetchOtp = async () => {
      try {
        const res = await get(
          `/viotp/session?keyId=${encodeURIComponent(selectedKeyId)}&requestId=${encodeURIComponent(requestId)}`,
        )
        if (res?.success) {
          const payload = res.data?.data || res.data
          const data = payload?.data || payload
          const code = data?.Code || data?.code
          const sms = data?.SmsContent || data?.smsContent

          if (code) {
            // update row with code
            setRows((prev) =>
              prev.map((r) => (r.requestId === requestId ? { ...r, code } : r)),
            )
            setOtpLoading((prev) => {
              const n = { ...prev }
              delete n[requestId]
              return n
            })
            Modal.info({
              title: 'OTP / Nội dung tin nhắn',
              content: (
                <div>
                  <div>
                    <Text strong>Phone:</Text> <Text code>{phone}</Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Code:</Text> <Text code>{code}</Text>
                  </div>
                  {sms && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Content:</Text>
                      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{sms}</pre>
                    </div>
                  )}
                </div>
              ),
            })
            clearInterval(timer)
          }
        }
      } catch {}

      if (Date.now() - start >= 60000) {
        // timeout
        setOtpLoading((prev) => {
          const n = { ...prev }
          delete n[requestId]
          return n
        })
        clearInterval(timer)
      }
    }

    fetchOtp()
    const timer = setInterval(fetchOtp, 5000)
  }

  const createBatch = async () => {
    if (!selectedKeyId) {
      message.warning('Vui lòng chọn key')
      return
    }

    if (!quantity || quantity < 1) {
      message.warning('Số lượng phải >= 1')
      return
    }

    setCreating(true)
    try {
      const resultsNotRegistered = []
      const newHistory = []

      // VIOTP expects network as pipe list, ending with |
      const networkParam = selectedNetworks?.length
        ? `${selectedNetworks.join('|')}|`
        : undefined

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

      // Lặp cho tới khi đủ số "dùng được" (chưa đăng kí) hoặc đạt giới hạn attempts
      const maxAttempts = Math.max(1, (quantity || 1) * (maxAttemptsMultiplier || DEFAULT_MAX_ATTEMPTS_MULTIPLIER))
      let attempts = 0

      while (resultsNotRegistered.length < quantity && attempts < maxAttempts) {
        attempts++

        // 1) rent phone from VIOTP
        const rentRes = await post('/viotp/request', {
          keyId: selectedKeyId,
          serviceId,
          country,
          ...(networkParam ? { network: networkParam } : {}),
        })

        const rentPayload = rentRes?.data?.data || rentRes?.data || rentRes
        const rentData = rentPayload?.data || rentPayload

        if (!rentPayload?.success && rentPayload?.status_code && rentPayload?.status_code !== 200) {
          message.error(rentPayload?.message || 'Thuê số thất bại')
          break
        }

        const phone = rentData?.phone_number
        const requestId = rentData?.request_id

        if (!phone || !requestId) {
          message.error('Thuê số thất bại (thiếu phone/request_id)')
          break
        }

        // 2) check shopee phone (rate-limit: mỗi lần check cách 2s)
        await sleep(2000)
        const checkRes = await post('/shopee/check-phone', { phone })

        if (checkRes?.success) {
          const exists = checkRes.data.exists
          const errorCode = checkRes.data.errorCode
          const msg = checkRes.data.message || ''

          const record = {
            phone,
            requestId,
            exists,
            errorCode,
            message: msg,
            amount: checkRes.data.amount,
            timestamp: Date.now(),
          }

          newHistory.push(record)

          // "Dùng được" khi số chưa tồn tại trên Shopee (hoặc check thành công exists=false)
          const usable = msg.includes('Số điện thoại chưa tồn tại trên Shopee') || (exists === false && errorCode === 0)
          if (usable) {
            resultsNotRegistered.push(record)
            // Cập nhật UI dần dần để user thấy tiến độ
            setRows([...resultsNotRegistered])
          }
        } else {
          const errMsg = checkRes?.error?.message || checkRes?.error || 'Check thất bại'
          newHistory.push({ phone, requestId, error: errMsg, timestamp: Date.now() })
        }
      }

      if (attempts >= maxAttempts && resultsNotRegistered.length < quantity) {
        message.warning(`Không tìm đủ số dùng được. Đã tìm được ${resultsNotRegistered.length}/${quantity} (đã thử ${attempts} lần).`)
      }

      // update state
      setRows(resultsNotRegistered)
      setHistory((prev) => [...newHistory, ...prev])

      // Refresh balance after operation
      fetchBalance(selectedKeyId)

      message.success(`Hoàn thành: ${resultsNotRegistered.length} số chưa đăng kí Shopee`) 
    } catch (e) {
      message.error(e?.message || 'Tạo thất bại')
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (v) => <Text code copyable={{ text: v }}>{v}</Text>,
    },
    {
      title: 'OTP',
      key: 'otp',
      width: 220,
      render: (_, r) => {
        if (r.code) {
          return (
            <Text code copyable={{ text: r.code }}>
              {r.code}
            </Text>
          )
        }

        if (otpLoading[r.requestId]) {
          return <Tag color="processing">Đang lấy OTP...</Tag>
        }

        return <Tag color="blue">Chưa có</Tag>
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, r) => (
        <Button
          icon={<MessageOutlined />}
          loading={!!otpLoading[r.requestId]}
          onClick={() => getOtp(r)}
        >
          {otpLoading[r.requestId] ? 'Đang lấy...' : 'Lấy OTP'}
        </Button>
      ),
    },
  ]

  const historyColumns = [
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 160 },
    {
      title: 'Kết quả',
      key: 'result',
      width: 160,
      render: (_, r) => {
        const msg = r.message || r.error || ''
        // Mapping mong muốn
        if (msg.includes('Số điện thoại này đã được sử dụng') || msg.includes('Tài khoản bị khóa') || r.exists) {
          return <Tag color="red">Đã tồn tại</Tag>
        }
        if (msg.includes('Số điện thoại chưa tồn tại trên Shopee') || (r.exists === false && r.errorCode === 0)) {
          return <Tag color="green">Dùng được</Tag>
        }
        if (msg.includes('Lỗi khi kiểm tra số điện thoại') || r.error || (r.errorCode !== undefined && r.errorCode !== 0)) {
          return <Tag color="orange">Lỗi</Tag>
        }
        // Fallback
        return <Tag>Lỗi</Tag>
      },
    },
    { title: 'Giá', dataIndex: 'amount', key: 'amount', width: 120, render: (v) => (v === 0 ? '0' : v ? `${v}` : '-') },
    {
      title: 'RequestId',
      dataIndex: 'requestId',
      key: 'requestId',
      width: 140,
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
     
<div className="flex flex-col gap-2">
  <div className="flex items-center justify-between gap-3">
    <div>
      <Title level={4} style={{ margin: 0 }}>
        VIOTP
      </Title>
      <Text type="secondary">
        Thuê số (VN/LA) → Check Shopee → chỉ hiển thị số chưa đăng kí. 
        Giá check: 120đ (chưa đăng kí), 10đ (đã đăng kí).
      </Text>
    </div>
    <Button icon={<KeyOutlined />} onClick={() => setKeyManagerOpen(true)}>
      Quản lý key
    </Button>
  </div>

  <Alert
    type="warning"
    showIcon
    title="Lưu ý về API key"
    description={
      <>
        Khi nhập <b>API key</b>, Autopee <b>có thể nhìn thấy key của bạn</b>.
        Việc sử dụng key <b>có thể tiềm ẩn rủi ro mất tiền</b> trong tài khoản thuê SIM.
        <br />
        Chỉ sử dụng nếu bạn tin tưởng. Autopee <b>không chịu trách nhiệm </b> 
        cho các vấn đề liên quan đến lộ key hoặc thất thoát số dư.
      </>
    }
  />
</div>

      </Card>

      <Card>
        <Space wrap size={12}>
          <Select
            style={{ width: 220 }}
            placeholder="Chọn key"
            value={selectedKeyId}
            options={keyOptions}
            onChange={setSelectedKeyId}
          />

          <Select
            style={{ width: 150 }}
            value={country}
            onChange={setCountry}
            options={[
              { value: 'vn', label: 'Việt Nam (vn)' },
              { value: 'la', label: 'Lào (la)' },
            ]}
          />

          <InputNumber
            min={1}
            max={999}
            value={serviceId}
            onChange={(v) => setServiceId(v || DEFAULT_SERVICE_ID)}
            addonBefore="Service ID"
          />

          <Select
            mode="multiple"
            style={{ width: 420 }}
            placeholder="Network (mặc định tất cả)"
            loading={networksLoading}
            value={selectedNetworks}
            options={networkOptions}
            onChange={setSelectedNetworks}
            maxTagCount="responsive"
          />

          <InputNumber
            min={1}
            max={100}
            value={quantity}
            onChange={(v) => setQuantity(v || DEFAULT_QUANTITY)}
            addonBefore="Số lượng"
          />

          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={createBatch}
            loading={creating}
          >
            Tạo
          </Button>
        </Space>
      </Card>

      <Card title="Danh sách số chưa đăng kí Shopee">
        <Table
          rowKey={(r) => `${r.phone}-${r.requestId}`}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="Lịch sử check">
        <Table
          rowKey={(r, idx) => `${r.phone}-${r.requestId || 'no'}-${idx}`}
          dataSource={history}
          columns={historyColumns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <ViotpKeyManagerModal
        open={keyManagerOpen}
        onClose={() => setKeyManagerOpen(false)}
        onChanged={() => loadKeys()}
      />
    </Space>
  )
}

