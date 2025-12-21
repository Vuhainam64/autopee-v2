import { useState, useEffect } from 'react'
import { Button, Input, Card, Table, Tag, App, Space, Typography, Collapse } from 'antd'
import { SearchOutlined, DeleteOutlined, ApiOutlined, CodeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { post, get } from '../../services/api.js'

const { TextArea } = Input
const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

const STORAGE_KEY = 'shopee_check_phone_history'

function CheckPhone() {
  const { message } = App.useApp()
  const [phoneList, setPhoneList] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  // Lưu kết quả vào localStorage với timestamp
  const saveResultsToStorage = (newResults) => {
    try {
      // Thêm timestamp vào các kết quả mới nếu chưa có
      const resultsWithTimestamp = newResults.map((result) => {
        if (!result.timestamp) {
          return { ...result, timestamp: Date.now() }
        }
        return result
      })
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resultsWithTimestamp))
    } catch (error) {
      console.error('Error saving history:', error)
    }
  }

  // Load lịch sử từ server
  const loadHistoryFromServer = async () => {
    try {
      const response = await get('/shopee/check-phone/history?limit=100')
      if (response?.success && response?.data?.history) {
        // Format dữ liệu từ server để phù hợp với format hiện tại
        const formattedResults = response.data.history.map((item) => ({
          phone: item.phone,
          exists: item.exists,
          message: item.message || (item.exists ? 'Số điện thoại đã tồn tại trên Shopee' : 'Số điện thoại chưa tồn tại trên Shopee'),
          amount: item.amount,
          balanceAfter: item.balanceAfter,
          errorCode: item.errorCode,
          timestamp: new Date(item.createdAt).getTime(),
        }))
        
        setResults(formattedResults)
        
        // Đồng bộ với localStorage
        saveResultsToStorage(formattedResults)
      }
    } catch (error) {
      console.error('Error loading history from server:', error)
      // Fallback: Load từ localStorage nếu server lỗi
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEY)
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory)
          const now = Date.now()
          const oneDayInMs = 24 * 60 * 60 * 1000
          
          const validResults = parsedHistory.filter((result) => {
            if (!result.timestamp) return false
            return now - result.timestamp < oneDayInMs
          })
          
          if (validResults.length !== parsedHistory.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validResults))
          }
          
          setResults(validResults)
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError)
      }
    }
  }

  // Load lịch sử từ server khi component mount
  useEffect(() => {
    loadHistoryFromServer()
  }, [])

  // Xóa lịch sử
  const clearHistory = () => {
    setResults([])
    localStorage.removeItem(STORAGE_KEY)
    message.success('Đã xóa lịch sử kết quả')
  }

  const handleCheckMultiple = async () => {
    const phones = phoneList
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p)

    if (phones.length === 0) {
      message.warning('Vui lòng nhập ít nhất một số điện thoại')
      return
    }

    setLoading(true)
    try {
      // Check tuần tự để tránh race condition khi trừ tiền
      const results = []
      for (let i = 0; i < phones.length; i++) {
        const phone = phones[i]
        try {
          const response = await post('/shopee/check-phone', { phone })
          if (response?.success) {
            results.push({
              ...response.data,
              phone: response.data.phone || phone,
              timestamp: Date.now(), // Thêm timestamp khi check thành công
            })
          } else {
            // Kiểm tra lỗi Missing bearer token
            const errorMessage = response?.error?.message || response?.error || ''
            const isMissingToken = 
              errorMessage.includes('Missing bearer token') ||
              response?.error === 'Missing bearer token'
            
            if (isMissingToken) {
              message.error('Vui lòng đăng nhập để sử dụng tính năng này')
              break
            }
            
            results.push({
              phone,
              exists: false,
              message: errorMessage || 'Lỗi không xác định',
              error: errorMessage,
              errorCode: response?.error?.code,
              timestamp: Date.now(), // Thêm timestamp khi có lỗi
            })
            // Nếu lỗi do số dư không đủ, dừng lại
            if (response?.error?.code === 'INSUFFICIENT_BALANCE') {
              message.error(response.error.message)
              break
            }
          }
        } catch (error) {
          // Kiểm tra lỗi Missing bearer token
          const errorMessage = error.message || ''
          const errorData = error.response?.data || {}
          const isMissingToken = 
            errorMessage.includes('Missing bearer token') ||
            errorData.error === 'Missing bearer token' ||
            errorData.error?.message === 'Missing bearer token'
          
          if (isMissingToken) {
            message.error('Vui lòng đăng nhập để sử dụng tính năng này')
            break
          }
          
          results.push({
            phone,
            exists: false,
            message: errorMessage || 'Lỗi khi kiểm tra',
            error: errorMessage,
            timestamp: Date.now(), // Thêm timestamp khi có exception
          })
          // Nếu lỗi do số dư không đủ, dừng lại
          if (error.response?.data?.error?.code === 'INSUFFICIENT_BALANCE') {
            message.error(error.response.data.error.message)
            break
          }
        }
      }

      // Reload lịch sử từ server sau khi check xong
      await loadHistoryFromServer()
      
      const successCount = results.filter((r) => r.exists !== undefined && !r.error).length
      if (successCount > 0) {
        message.success(`Đã kiểm tra ${successCount}/${phones.length} số điện thoại`)
      }
    } catch (error) {
      console.error('Error checking phones:', error)
      message.error('Lỗi khi kiểm tra số điện thoại')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Kết quả',
      dataIndex: 'exists',
      key: 'exists',
      width: 120,
      render: (exists) => {
        if (exists === undefined) return <Tag color="default">Lỗi</Tag>
        return exists ? (
          <Tag color="red">Đã tồn tại</Tag>
        ) : (
          <Tag color="green">Chưa tồn tại</Tag>
        )
      },
    },
    {
      title: 'Thông báo',
      dataIndex: 'message',
      key: 'message',
      render: (msg, record) => {
        if (record.error) {
          return <Text type="danger">{record.error}</Text>
        }
        return msg || '-'
      },
    },
    {
      title: 'Giá',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => {
        if (amount === undefined || amount === null) return '-'
        return <Text strong style={{ color: '#ff4d4f' }}>-{amount.toLocaleString('vi-VN')} VND</Text>
      },
    },
    {
      title: 'Số dư sau',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 150,
      render: (balance) => {
        if (balance === undefined || balance === null) return '-'
        return <Text>{balance.toLocaleString('vi-VN')} VND</Text>
      },
    },
  ]

  return (
    <div className="!space-y-4">
      <div>
        <Title level={2}>Check Số Điện Thoại Shopee</Title>
        <Text type="secondary">
          Kiểm tra số điện thoại đã đăng ký tài khoản Shopee hay chưa
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <Card title="Kiểm tra hàng loạt" className="h-fit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Text strong>Danh sách số điện thoại (mỗi dòng một số):</Text>
                <TextArea
                  rows={6}
                  placeholder="0912345678&#10;0987654321&#10;..."
                  value={phoneList}
                  onChange={(e) => setPhoneList(e.target.value)}
                  className="mt-2!"
                />
              </div>
              <Button
                type="primary"
                onClick={handleCheckMultiple}
                loading={loading}
                block
                size="large"
                icon={<SearchOutlined />}
              >
                Kiểm tra hàng loạt
              </Button>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 h-full">
              <Text type="secondary" className="text-sm">
                <strong>Lưu ý về giá:</strong>
                <br />
                • Số điện thoại <strong>chưa tồn tại</strong> trên Shopee: <strong className="text-orange-600">1,000 VND</strong>
                <br />
                • Số điện thoại <strong>đã tồn tại</strong> trên Shopee: <strong className="text-orange-600">100 VND</strong>
                <br />
                • Các trường hợp <strong>lỗi khác</strong> trên Shopee: <strong className="text-orange-600">0 VND</strong>
              </Text>
            </div>
          </div>
        </Card>
      </div>

      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Kết quả</span>
            {results.length > 0 && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={clearHistory}
                size="small"
              >
                Xóa lịch sử
              </Button>
            )}
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={results}
          rowKey={(record) => record.phone || `result-${record.errorCode || Date.now()}-${Math.random()}`}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'Chưa có kết quả. Vui lòng kiểm tra số điện thoại để xem kết quả.',
          }}
        />
      </Card>

      <Card 
        title={
          <div className="flex items-center gap-2">
            <ApiOutlined />
            <span>Hướng dẫn sử dụng API</span>
          </div>
        }
      >
        <Collapse
          items={[
            {
              key: '1',
              label: 'Thông tin API',
              children: (
                <div className="space-y-3">
                  <div>
                    <Text strong>Endpoint:</Text>
                    <Paragraph code copyable className="mt-1">
                      POST /shopee/check-phone
                    </Paragraph>
                  </div>
                  <div>
                    <Text strong>Authentication:</Text>
                    <Text className="ml-2">Yêu cầu Bearer Token </Text>
                  </div>
                  <div>
                    <Text strong>Lấy Token:</Text>
                    <Text className="ml-2">
                      Vào trang <Link to="/settings/api" className="text-orange-600 hover:underline">Settings → Tài liệu API</Link> để tạo và copy token
                    </Text>
                  </div>
                  <div>
                    <Text strong>Request Body:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "phone": "0912345678"
}`}
                    </pre>
                  </div>
                </div>
              ),
            },
            {
              key: '2',
              label: 'Response',
              children: (
                <div className="space-y-3">
                  <div>
                    <Text strong>Success Response:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "phone": "912345678",
    "exists": true,
    "message": "Số điện thoại đã tồn tại trên Shopee",
    "errorCode": 2,
    "amount": 100,
    "balanceAfter": 50000
  }
}`}
                    </pre>
                  </div>
                  <div>
                    <Text strong>Error Response:</Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": false,
  "error": {
    "message": "Số dư không đủ...",
    "code": "INSUFFICIENT_BALANCE"
  }
}`}
                    </pre>
                  </div>
                </div>
              ),
            },
            {
              key: '3',
              label: 'Ví dụ sử dụng',
              children: (
                <div className="space-y-4">
                  <div>
                    <Text strong className="flex items-center gap-2">
                      <CodeOutlined />
                      cURL
                    </Text>
                    <Text className="text-sm text-slate-600 mb-2 block">
                      Thay <code className="bg-slate-100 px-1 rounded">YOUR_TOKEN</code> bằng token bạn đã tạo ở <Link to="/settings/api" className="text-orange-600 hover:underline">Settings → Tài liệu API</Link>
                    </Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`curl -X POST https://api.autopee.com/shopee/check-phone \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"phone": "0912345678"}'`}
                    </pre>
                  </div>
                  <div>
                    <Text strong className="flex items-center gap-2">
                      <CodeOutlined />
                      JavaScript (fetch)
                    </Text>
                    <Text className="text-sm text-slate-600 mb-2 block">
                      Thay <code className="bg-slate-100 px-1 rounded">YOUR_TOKEN</code> bằng token bạn đã tạo ở <Link to="/settings/api" className="text-orange-600 hover:underline">Settings → Tài liệu API</Link>
                    </Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`const response = await fetch('https://api.autopee.com/shopee/check-phone', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ phone: '0912345678' })
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
                    <Text className="text-sm text-slate-600 mb-2 block">
                      Thay <code className="bg-slate-100 px-1 rounded">YOUR_TOKEN</code> bằng token bạn đã tạo ở <Link to="/settings/api" className="text-orange-600 hover:underline">Settings → Tài liệu API</Link>
                    </Text>
                    <pre className="bg-slate-50 p-3 rounded mt-2 overflow-x-auto">
{`import requests

url = 'https://api.autopee.com/shopee/check-phone'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
}
data = {'phone': '0912345678'}

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
              label: 'Bảng giá',
              children: (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text>Số điện thoại <strong>chưa tồn tại</strong> trên Shopee</Text>
                    <Tag color="green">1,000 VND</Tag>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text>Số điện thoại <strong>đã tồn tại</strong> trên Shopee</Text>
                    <Tag color="orange">100 VND</Tag>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <Text>Các trường hợp <strong>lỗi khác</strong></Text>
                    <Tag>0 VND</Tag>
                  </div>
                </div>
              ),
            },
            {
              key: '5',
              label: 'Lưu ý',
              children: (
                <div className="space-y-2">
                  <Text>• Số điện thoại sẽ tự động được xử lý (xóa số 0 ở đầu nếu có)</Text>
                  <Text>• API sẽ tự động trừ tiền từ ví của bạn sau khi check thành công</Text>
                  <Text>• Nếu số dư không đủ, API sẽ trả về lỗi <Tag color="red">INSUFFICIENT_BALANCE</Tag></Text>
                  <Text>• Lịch sử check sẽ được lưu lại và có thể xem qua API <Paragraph code className="inline">GET /shopee/check-phone/history</Paragraph></Text>
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

export default CheckPhone

