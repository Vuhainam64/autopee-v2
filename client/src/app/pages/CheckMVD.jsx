import { useState } from 'react'
import { Button, Input, Card, Table, Tag, App, Space, Typography, Select, Form } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { post } from '../services/api.js'

const { TextArea } = Input
const { Text, Title } = Typography
const { Option } = Select

const CARRIERS = [
  { value: '', label: 'Tự động phát hiện' },
  { value: 'SPX', label: 'SPX Express' },
  { value: 'JNT', label: 'J&T Express' },
  { value: 'GHN', label: 'Giao Hàng Nhanh (GHN)' },
  { value: 'NJV', label: 'Ninja Van' },
]

function CheckMVD() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [singleTrackingID, setSingleTrackingID] = useState('')
  const [singleCarrier, setSingleCarrier] = useState('')
  const [singleCellphone, setSingleCellphone] = useState('')
  const [trackingList, setTrackingList] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const handleSingleTrack = async () => {
    if (!singleTrackingID.trim()) {
      message.warning('Vui lòng nhập mã vận đơn')
      return
    }

    if (singleCarrier === 'JNT' && !singleCellphone.trim()) {
      message.warning('Vui lòng nhập số điện thoại cho J&T Express')
      return
    }

    setLoading(true)
    try {
      const response = await post('/tracking', {
        trackingID: singleTrackingID.trim(),
        webtracking: singleCarrier || undefined,
        cellphone: singleCellphone.trim() || undefined,
      })

      if (response?.success) {
        setResults([response.data])
        message.success('Đã tra cứu mã vận đơn thành công')
      } else {
        message.error(response?.error?.message || 'Lỗi khi tra cứu mã vận đơn')
        setResults([{
          trackingID: singleTrackingID.trim(),
          success: false,
          error: response?.error?.message || 'Lỗi không xác định',
        }])
      }
    } catch (error) {
      console.error('Error tracking:', error)
      message.error('Lỗi khi tra cứu mã vận đơn')
      setResults([{
        trackingID: singleTrackingID.trim(),
        success: false,
        error: error.message || 'Lỗi mạng hoặc server',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleBatchTrack = async () => {
    const lines = trackingList
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)

    if (lines.length === 0) {
      message.warning('Vui lòng nhập ít nhất một mã vận đơn')
      return
    }

    // Parse tracking list: format "trackingID|cellphone" or just "trackingID"
    const trackingListParsed = lines.map((line) => {
      const parts = line.split('|')
      return {
        trackingID: parts[0].trim(),
        cellphone: parts[1]?.trim() || undefined,
      }
    })

    setLoading(true)
    try {
      const response = await post('/tracking/list', {
        trackingList: trackingListParsed,
      })

      if (response?.success) {
        setResults(response.data.results)
        const successCount = response.data.successCount
        message.success(`Đã tra cứu ${successCount}/${response.data.total} mã vận đơn`)
      } else {
        message.error(response?.error?.message || 'Lỗi khi tra cứu mã vận đơn')
      }
    } catch (error) {
      console.error('Error tracking:', error)
      message.error('Lỗi khi tra cứu mã vận đơn')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Mã vận đơn',
      dataIndex: 'trackingID',
      key: 'trackingID',
      width: 150,
      render: (text) => <Text copyable strong>{text}</Text>,
    },
    {
      title: 'Nhà vận chuyển',
      dataIndex: 'carrier',
      key: 'carrier',
      width: 120,
      render: (carrier) => {
        if (!carrier) return '-'
        const carrierMap = {
          SPX: { color: 'blue', label: 'SPX' },
          JNT: { color: 'orange', label: 'J&T' },
          GHN: { color: 'green', label: 'GHN' },
          NJV: { color: 'purple', label: 'Ninja Van' },
          AUTO: { color: 'default', label: 'Tự động' },
        }
        const info = carrierMap[carrier] || { color: 'default', label: carrier }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'success',
      key: 'success',
      width: 100,
      render: (success, record) => {
        if (record.error) {
          return <Tag color="red">Lỗi</Tag>
        }
        return success !== false ? (
          <Tag color="green">Thành công</Tag>
        ) : (
          <Tag color="red">Lỗi</Tag>
        )
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
      width: 120,
      render: (time) => time || '-',
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => date || '-',
    },
    {
      title: 'Thông báo',
      dataIndex: 'message',
      key: 'message',
      render: (msg, record) => {
        if (record.error) {
          return <Text type="danger">{record.error}</Text>
        }
        return <Text>{msg || '-'}</Text>
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <Title level={2}>Tra Cứu Mã Vận Đơn</Title>
        <Text type="secondary">
          Tra cứu thông tin vận đơn từ các nhà vận chuyển: SPX, J&T Express, GHN, Ninja Van
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Tra cứu đơn lẻ" className="h-fit">
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <Text strong>Mã vận đơn:</Text>
              <Input
                placeholder="Nhập mã vận đơn (VD: SPX123456789)"
                value={singleTrackingID}
                onChange={(e) => setSingleTrackingID(e.target.value)}
                size="large"
                className="mt-2"
              />
            </div>
            <div>
              <Text strong>Nhà vận chuyển (tùy chọn):</Text>
              <Select
                placeholder="Tự động phát hiện"
                value={singleCarrier}
                onChange={setSingleCarrier}
                className="w-full mt-2"
                size="large"
              >
                {CARRIERS.map((carrier) => (
                  <Option key={carrier.value} value={carrier.value}>
                    {carrier.label}
                  </Option>
                ))}
              </Select>
            </div>
            {singleCarrier === 'JNT' && (
              <div>
                <Text strong>Số điện thoại (bắt buộc cho J&T):</Text>
                <Input
                  placeholder="Nhập số điện thoại"
                  value={singleCellphone}
                  onChange={(e) => setSingleCellphone(e.target.value.replace(/[^0-9]/g, ''))}
                  size="large"
                  className="mt-2"
                />
              </div>
            )}
            <Button
              type="primary"
              onClick={handleSingleTrack}
              loading={loading}
              block
              size="large"
              icon={<SearchOutlined />}
            >
              Tra cứu
            </Button>
          </Space>
        </Card>

        <Card title="Tra cứu hàng loạt" className="h-fit">
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <Text strong>Danh sách mã vận đơn (mỗi dòng một mã):</Text>
              <Text className="text-xs text-slate-500 block mb-1">
                Format: MãVậnĐơn hoặc MãVậnĐơn|SốĐiệnThoại (cho J&T)
              </Text>
              <TextArea
                rows={8}
                placeholder="SPX123456789&#10;JNT987654321|0912345678&#10;G123456789&#10;..."
                value={trackingList}
                onChange={(e) => setTrackingList(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              type="primary"
              onClick={handleBatchTrack}
              loading={loading}
              block
              size="large"
              icon={<SearchOutlined />}
            >
              Tra cứu hàng loạt
            </Button>
          </Space>
        </Card>
      </div>

      {results.length > 0 && (
        <Card title="Kết quả tra cứu">
          <Table
            columns={columns}
            dataSource={results}
            rowKey={(record, index) => record.trackingID || `result-${index}`}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: 'Chưa có kết quả',
            }}
          />
        </Card>
      )}
    </div>
  )
}

export default CheckMVD
