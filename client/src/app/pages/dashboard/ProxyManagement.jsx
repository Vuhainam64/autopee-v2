import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Card,
  Popconfirm,
  Switch,
  Tooltip,
  message,
  App,
  Badge,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { get, post, put, del } from '../../services/api.js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Title, Text } = Typography
const { Option } = Select

const ProxyManagement = () => {
  const { message: messageApi } = App.useApp()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [form] = Form.useForm()
  const [currentTime, setCurrentTime] = useState(Date.now())

  const loadKeys = async () => {
    try {
      setLoading(true)
      const response = await get('/proxy/keys')
      if (response?.success) {
        setKeys(response.data || [])
      }
    } catch (error) {
      messageApi.error('Không thể tải danh sách proxy keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  useEffect(() => {
    // Cập nhật thời gian mỗi giây để hiển thị thời gian còn lại real-time
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    // Tự động kiểm tra và đổi proxy mỗi 30 giây
    const checkInterval = setInterval(async () => {
      // Kiểm tra các keys có proxy đã đến thời gian cho phép đổi
      const keysToRefresh = keys.filter((key) => {
        if (!key.isActive || !key.currentProxy) return false
        
        const { expirationAt, nextRequestAt } = key.currentProxy
        const now = Date.now()
        
        // Đổi nếu: đã hết hạn hoặc đã đến thời gian cho phép đổi (nextRequestAt)
        return (
          (expirationAt && expirationAt <= now) ||
          (nextRequestAt && nextRequestAt <= now)
        )
      })

      // Tự động đổi proxy cho các keys đã đến thời gian
      for (const key of keysToRefresh) {
        try {
          const response = await post(`/proxy/keys/${key._id}/refresh`)
          if (response?.success) {
            messageApi.success(`Đã tự động đổi proxy cho ${key.name}`)
            await loadKeys()
          }
        } catch (error) {
          // Không hiển thị lỗi để tránh spam notification
          console.error(`Failed to auto refresh proxy for ${key.name}:`, error)
        }
      }
    }, 30000) // Kiểm tra mỗi 30 giây
    
    return () => clearInterval(checkInterval)
  }, [keys, messageApi])

  const handleAdd = () => {
    form.resetFields()
    setEditingKey(null)
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    form.setFieldsValue({
      key: record.key,
      name: record.name,
      region: record.region,
      isActive: record.isActive,
      usedByApis: record.usedByApis || [],
    })
    setEditingKey(record)
    setModalOpen(true)
  }

  const handleDelete = async (record) => {
    try {
      const response = await del(`/proxy/keys/${record._id}`)
      if (response?.success) {
        messageApi.success('Đã xóa proxy key')
        await loadKeys()
      } else {
        messageApi.error(response?.error?.message || 'Không thể xóa')
      }
    } catch (error) {
      messageApi.error('Có lỗi xảy ra khi xóa')
    }
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      if (editingKey) {
        const response = await put(`/proxy/keys/${editingKey._id}`, values)
        if (response?.success) {
          messageApi.success('Đã cập nhật proxy key')
          setModalOpen(false)
          await loadKeys()
        } else {
          messageApi.error(response?.error?.message || 'Không thể cập nhật')
        }
      } else {
        const response = await post('/proxy/keys', values)
        if (response?.success) {
          messageApi.success(response.message || 'Đã thêm proxy key')
          setModalOpen(false)
          await loadKeys()
        } else {
          messageApi.error(response?.error?.message || 'Không thể thêm')
        }
      }
    } catch (error) {
      messageApi.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async (record) => {
    try {
      setLoading(true)
      const response = await post(`/proxy/keys/${record._id}/refresh`)
      if (response?.success) {
        messageApi.success('Đã lấy proxy mới thành công')
        await loadKeys()
      } else {
        messageApi.error(response?.error?.message || 'Không thể lấy proxy mới')
      }
    } catch (error) {
      messageApi.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = async (record) => {
    try {
      setLoading(true)
      const response = await post(`/proxy/keys/${record._id}/check`)
      if (response?.success) {
        messageApi.success('Đã cập nhật thông tin proxy')
        await loadKeys()
      } else {
        messageApi.error(response?.error?.message || 'Không thể kiểm tra proxy')
      }
    } catch (error) {
      messageApi.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleRelease = async (record) => {
    try {
      setLoading(true)
      const response = await post(`/proxy/keys/${record._id}/release`)
      if (response?.success) {
        messageApi.success('Đã thoát proxy thành công')
        await loadKeys()
      } else {
        messageApi.error(response?.error?.message || 'Không thể thoát proxy')
      }
    } catch (error) {
      messageApi.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (minutes > 0) {
      return `${minutes} phút ${secs} giây`
    }
    return `${secs} giây`
  }

  const formatRegion = (region) => {
    const map = {
      bac: 'Miền Bắc',
      trung: 'Miền Trung',
      nam: 'Miền Nam',
      random: 'Ngẫu nhiên',
    }
    return map[region] || region
  }

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text) => (
        <Text code copyable={{ text }}>
          {text.substring(0, 20)}...
        </Text>
      ),
    },
    {
      title: 'Vùng',
      dataIndex: 'region',
      key: 'region',
      width: 120,
      render: (region) => <Tag color="blue">{formatRegion(region)}</Tag>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space>
          <Badge
            status={record.isActive ? 'success' : 'default'}
            text={record.isActive ? 'Hoạt động' : 'Tắt'}
          />
          {record.currentProxy ? (
            <Tag color="green">Có proxy</Tag>
          ) : (
            <Tag color="red">Chưa có proxy</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Proxy hiện tại',
      key: 'proxy',
      width: 200,
      render: (_, record) => {
        if (!record.currentProxy) return <Text type="secondary">-</Text>
        return (
          <Space direction="vertical" size="small">
            <Text>
              <strong>HTTP:</strong> {record.currentProxy.http || '-'}
            </Text>
            <Text>
              <strong>SOCKS5:</strong> {record.currentProxy.socks5 || '-'}
            </Text>
            <Text type="secondary">
              <strong>Địa điểm:</strong> {record.currentProxy.location || '-'}
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => {
        if (!record.currentProxy) return <Text type="secondary">-</Text>
        const { expirationAt, ttl } = record.currentProxy
        
        // Tính thời gian còn lại dựa trên expirationAt và thời gian hiện tại
        let remainingSeconds = 0
        if (expirationAt) {
          remainingSeconds = Math.max(0, Math.floor((expirationAt - currentTime) / 1000))
        } else if (ttl && record.lastCheckedAt) {
          // Fallback: tính từ ttl và lastCheckedAt nếu không có expirationAt
          const elapsed = Math.floor((currentTime - new Date(record.lastCheckedAt).getTime()) / 1000)
          remainingSeconds = Math.max(0, ttl - elapsed)
        }
        
        return (
          <Space direction="vertical" size="small">
            {remainingSeconds > 0 && (
              <Text>
                <strong>Còn lại:</strong>{' '}
                <Tag color={remainingSeconds > 60 ? 'green' : remainingSeconds > 10 ? 'orange' : 'red'}>
                  {formatTime(remainingSeconds)}
                </Tag>
              </Text>
            )}
            {expirationAt && (
              <Text type="secondary">
                <strong>Hết hạn:</strong>{' '}
                {dayjs(expirationAt).format('DD/MM/YYYY HH:mm:ss')}
              </Text>
            )}
            {remainingSeconds === 0 && expirationAt && (
              <Tag color="red">Đã hết hạn</Tag>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Dùng cho API',
      dataIndex: 'usedByApis',
      key: 'usedByApis',
      width: 200,
      render: (apis) => {
        if (!apis || apis.length === 0) {
          return <Text type="secondary">Chưa cấu hình</Text>
        }
        return (
          <Space wrap>
            {apis.map((api) => (
              <Tag key={api} color="purple">
                {api}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="Kiểm tra proxy hiện tại">
            <Button
              icon={<CheckCircleOutlined />}
              size="small"
              onClick={() => handleCheck(record)}
            >
              Kiểm tra
            </Button>
          </Tooltip>
          <Tooltip title="Lấy proxy mới">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => handleRefresh(record)}
            >
              Đổi proxy
            </Button>
          </Tooltip>
          <Tooltip title="Thoát proxy">
            <Button
              icon={<LogoutOutlined />}
              size="small"
              danger
              onClick={() => handleRelease(record)}
            >
              Thoát
            </Button>
          </Tooltip>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa proxy key này?"
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Quản lý Proxy</Title>
        <Text type="secondary">
          Quản lý các proxy keys từ KiotProxy và cấu hình API sử dụng proxy
        </Text>
      </div>

      <Card>
        <div className="mb-4 flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm Proxy Key
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={keys}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} proxy key`,
          }}
        />
      </Card>

      <Modal
        title={editingKey ? 'Sửa Proxy Key' : 'Thêm Proxy Key'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingKey && (
            <Form.Item
              name="key"
              label="Proxy Key"
              rules={[{ required: true, message: 'Vui lòng nhập proxy key' }]}
            >
              <Input placeholder="Kf1f3740ed14847e6b63b4c6dc4393190" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Proxy Key 1" />
          </Form.Item>

          <Form.Item
            name="region"
            label="Vùng"
            rules={[{ required: true, message: 'Vui lòng chọn vùng' }]}
            initialValue="random"
          >
            <Select>
              <Option value="bac">Miền Bắc</Option>
              <Option value="trung">Miền Trung</Option>
              <Option value="nam">Miền Nam</Option>
              <Option value="random">Ngẫu nhiên</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="usedByApis"
            label="Dùng cho các API"
            tooltip="Các API endpoint sẽ sử dụng proxy này. Chọn từ danh sách hoặc nhập tùy chỉnh"
            initialValue={[]}
          >
            <Select
              mode="tags"
              placeholder="Chọn hoặc nhập API endpoint và nhấn Enter"
              tokenSeparators={[',']}
              allowClear
            >
              <Option value="/shopee/check-phone">/shopee/check-phone</Option>
              <Option value="/shopee/orders">/shopee/orders</Option>
              <Option value="/shopee/order-detail">/shopee/order-detail</Option>
              <Option value="/shopee/save-voucher">/shopee/save-voucher</Option>
              <Option value="/account/getAccountInfo">/account/getAccountInfo (Lấy cookie/account Shopee)</Option>
            </Select>
          </Form.Item>

          {editingKey && (
            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default ProxyManagement

