import { useState } from 'react'
import { Button, Input, Card, Table, Tag, App, Space, Typography, Select, Form, Collapse } from 'antd'
import { SearchOutlined, ReloadOutlined, CodeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { post } from '../services/api.js'

const { TextArea } = Input
const { Text, Title, Paragraph } = Typography
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

      <Card title="Hướng dẫn sử dụng API" className="mt-4">
        <Collapse
          items={[
            {
              key: '1',
              label: '1. Tra cứu đơn lẻ',
              children: (
                <div className="space-y-4">
                  <div>
                    <Text strong>API Endpoint:</Text>
                    <Paragraph code className="ml-2">POST /tracking</Paragraph>
                  </div>
                  <div>
                    <Text strong>Authentication:</Text>
                    <Text className="ml-2">Không bắt buộc</Text>
                  </div>
                  <div>
                    <Text strong>Request Body:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "trackingID": "SPX123456789",  // Mã vận đơn (bắt buộc)
  "webtracking": "SPX",          // Nhà vận chuyển (tùy chọn): SPX, JNT, GHN, NJV
  "cellphone": "0912345678"      // Số điện thoại (bắt buộc cho J&T)
}`}
                    </pre>
                  </div>
                  <div>
                    <Text strong>Success Response:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "trackingID": "SPX123456789",
    "carrier": "SPX",
    "success": true,
    "status": "Đã giao hàng",
    "time": "14:30",
    "date": "2024-01-15",
    "message": "..."
  }
}`}
                    </pre>
                  </div>
                </div>
              ),
            },
            {
              key: '2',
              label: '2. Tra cứu hàng loạt',
              children: (
                <div className="space-y-4">
                  <div>
                    <Text strong>API Endpoint:</Text>
                    <Paragraph code className="ml-2">POST /tracking/list</Paragraph>
                  </div>
                  <div>
                    <Text strong>Authentication:</Text>
                    <Text className="ml-2">Không bắt buộc</Text>
                  </div>
                  <div>
                    <Text strong>Request Body:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "trackingList": [
    {
      "trackingID": "SPX123456789",
      "webtracking": "SPX",
      "cellphone": null
    },
    {
      "trackingID": "JNT987654321",
      "webtracking": "JNT",
      "cellphone": "0912345678"
    }
  ]
}`}
                    </pre>
                  </div>
                  <div>
                    <Text strong>Success Response:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "results": [
      {
        "trackingID": "SPX123456789",
        "carrier": "SPX",
        "success": true,
        "status": "Đã giao hàng",
        ...
      }
    ],
    "total": 2,
    "successCount": 2
  }
}`}
                    </pre>
                  </div>
                </div>
              ),
            },
            {
              key: '3',
              label: '3. Ví dụ code',
              children: (
                <div className="space-y-4">
                  <div>
                    <Text strong className="flex items-center gap-2">
                      <CodeOutlined />
                      cURL
                    </Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`curl -X POST 'https://api.autopee.com/tracking' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "trackingID": "SPX123456789",
    "webtracking": "SPX"
  }'`}
                    </pre>
                  </div>
                  <div>
                    <Text strong className="flex items-center gap-2">
                      <CodeOutlined />
                      JavaScript (fetch)
                    </Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`const response = await fetch('https://api.autopee.com/tracking', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    trackingID: 'SPX123456789',
    webtracking: 'SPX'
  })
});

const data = await response.json();
console.log(data);`}
                    </pre>
                  </div>
                  <div>
                    <Text strong className="flex items-center gap-2">
                      <CodeOutlined />
                      Python (requests)
                    </Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`import requests

url = 'https://api.autopee.com/tracking'
headers = {
    'Content-Type': 'application/json'
}
data = {
    'trackingID': 'SPX123456789',
    'webtracking': 'SPX'
}

response = requests.post(url, json=data, headers=headers)
result = response.json()
print(result)`}
                    </pre>
                  </div>
                </div>
              ),
            },
            {
              key: '4',
              label: '4. Nhà vận chuyển hỗ trợ',
              children: (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text strong>SPX Express</Text>
                    <Tag color="blue">SPX</Tag>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text strong>J&T Express</Text>
                    <Tag color="orange">JNT (cần số điện thoại)</Tag>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text strong>Giao Hàng Nhanh</Text>
                    <Tag color="green">GHN</Tag>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text strong>Ninja Van</Text>
                    <Tag color="purple">NJV</Tag>
                  </div>
                </div>
              ),
            },
            {
              key: '5',
              label: '5. Lưu ý',
              children: (
                <div className="space-y-2">
                  <Text>• Nếu không chỉ định <Paragraph code className="inline">webtracking</Paragraph>, hệ thống sẽ tự động phát hiện nhà vận chuyển dựa trên mã vận đơn</Text>
                  <Text>• J&T Express yêu cầu số điện thoại để tra cứu</Text>
                  <Text>• Format mã vận đơn hàng loạt: <Paragraph code className="inline">MãVậnĐơn|SốĐiệnThoại</Paragraph> (cho J&T)</Text>
                  <Text>• API không yêu cầu authentication</Text>
                </div>
              ),
            },
          ]}
          defaultActiveKey={['1']}
        />
      </Card>
    </div>
  )
}

export default CheckMVD
