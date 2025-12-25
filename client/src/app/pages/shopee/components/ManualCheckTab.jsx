import { useState, useEffect } from 'react'
import { Button, Input, Card, Table, Tag, App, Typography } from 'antd'
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { post, get } from '../../../services/api.js'

const { TextArea } = Input
const { Text, Title } = Typography

const STORAGE_KEY = 'shopee_check_phone_history'

export default function ManualCheckTab() {
  const { message } = App.useApp()
  const [phoneList, setPhoneList] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const saveResultsToStorage = (newResults) => {
    try {
      const resultsWithTimestamp = newResults.map((result) => {
        if (!result.timestamp) {
          return { ...result, timestamp: Date.now() }
        }
        return result
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resultsWithTimestamp))
    } catch {}
  }

  const loadHistoryFromServer = async () => {
    try {
      const response = await get('/shopee/check-phone/history?limit=100')
      if (response?.success && response?.data?.history) {
        const formattedResults = response.data.history.map((item, index) => {
          const timestamp = new Date(item.createdAt).getTime()
          return {
            phone: item.phone,
            exists: item.exists,
            message:
              item.message ||
              (item.exists
                ? 'Số điện thoại đã tồn tại trên Shopee'
                : 'Số điện thoại chưa tồn tại trên Shopee'),
            amount: item.amount,
            balanceAfter: item.balanceAfter,
            errorCode: item.errorCode,
            timestamp,
            uniqueId: `${item.phone}-${timestamp}-${index}`,
          }
        })

        setResults(formattedResults)
        saveResultsToStorage(formattedResults)
      }
    } catch {
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEY)
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory)
          setResults(parsedHistory)
        }
      } catch {}
    }
  }

  useEffect(() => {
    loadHistoryFromServer()
  }, [])

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
    let successCount = 0
    let errorCount = 0
    
    try {
      for (let i = 0; i < phones.length; i++) {
        const phone = phones[i]
        try {
          await post('/shopee/check-phone', { phone })
          successCount++
        } catch (error) {
          console.error(`Error checking phone ${phone}:`, error)
          errorCount++
        }
        
        // Add small delay between requests to avoid rate limiting
        if (i < phones.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      await loadHistoryFromServer()
      
      if (successCount > 0 && errorCount === 0) {
        message.success(`Đã kiểm tra thành công ${successCount} số điện thoại`)
      } else if (successCount > 0) {
        message.warning(`Đã kiểm tra thành công ${successCount} số, lỗi ${errorCount} số`)
      } else {
        message.error(`Không kiểm tra được số nào. Vui lòng thử lại sau.`)
      }
    } catch (error) {
      message.error(error?.message || 'Lỗi khi kiểm tra số điện thoại')
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
      render: (exists, record) => {
        const msg = record.message || ''
        // Mapping theo yêu cầu
        if (msg.includes('Số điện thoại này đã được sử dụng') || msg.includes('Tài khoản bị khóa') || exists === true) {
          return <Tag color="red">Đã tồn tại</Tag>
        }
        if (msg.includes('Số điện thoại chưa tồn tại trên Shopee') || (exists === false && record.errorCode === 0)) {
          return <Tag color="green">Dùng được</Tag>
        }
        if (msg.includes('Lỗi khi kiểm tra số điện thoại') || (record.errorCode !== undefined && record.errorCode !== 0)) {
          return <Tag color="orange">Lỗi</Tag>
        }
        // Fallback
        return <Tag color="orange">Lỗi</Tag>
      },
    },
    {
      title: 'Thông báo',
      dataIndex: 'message',
      key: 'message',
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
    <div className="space-y-4">
      <div>
        <Title level={3} style={{ marginBottom: 0 }}>
          Check Số (Nhập tay)
        </Title>
        <Text type="secondary">Kiểm tra số điện thoại đã đăng ký tài khoản Shopee hay chưa</Text>
      </div>

      <Card title="Kiểm tra hàng loạt" className="h-fit">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Text strong>Danh sách số điện thoại (mỗi dòng một số):</Text>
              <TextArea
                rows={6}
                placeholder="0912345678\n0987654321\n..."
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
              <br />• Số điện thoại <strong>chưa tồn tại</strong> trên Shopee:{' '}
              <strong className="text-orange-600">120 VND</strong>
              <br />• Số điện thoại <strong>đã tồn tại</strong> trên Shopee:{' '}
              <strong className="text-orange-600">10 VND</strong>
              <br />• Lỗi khác: <strong className="text-orange-600">0 VND</strong>
            </Text>
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center justify-between">
            <span>Kết quả</span>
            {results.length > 0 && (
              <Button type="text" danger icon={<DeleteOutlined />} onClick={clearHistory} size="small">
                Xóa lịch sử
              </Button>
            )}
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={results}
          rowKey={(record) => record.uniqueId || `${record.phone}-${record.timestamp || Date.now()}`}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

