import { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, Input, Modal, Form, App, Popconfirm, Space, Alert, Typography, Divider, Switch } from 'antd'
import { PlusOutlined, CopyOutlined, DeleteOutlined, EditOutlined, ApiOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { get, post, put, del } from '../../services/api.js'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography
const { TextArea } = Input

function ApiSettings() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingToken, setEditingToken] = useState(null)
  const [newToken, setNewToken] = useState(null)
  const [fullTokensMap, setFullTokensMap] = useState({}) // Map tokenId -> fullToken
  const [form] = Form.useForm()
  const { message: messageApi } = App.useApp()

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    setLoading(true)
    try {
      const response = await get('/user/api-tokens')
      if (response?.success) {
        const tokensData = response.data || []
        setTokens(tokensData)
        
        // Lưu fullToken vào map nếu có trong response
        const tokensMap = {}
        tokensData.forEach(token => {
          if (token.fullToken) {
            tokensMap[token._id] = token.fullToken
          }
        })
        if (Object.keys(tokensMap).length > 0) {
          setFullTokensMap(prev => ({ ...prev, ...tokensMap }))
        }
      }
    } catch (error) {
      messageApi.error('Lỗi khi tải danh sách tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingToken(null)
    setNewToken(null)
    form.resetFields()
    form.setFieldsValue({ name: 'Default Token' })
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingToken(record)
    setNewToken(null)
    form.setFieldsValue({ 
      name: record.name,
      isActive: record.isActive 
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await del(`/user/api-tokens/${id}`)
      messageApi.success('Đã xóa token')
      fetchTokens()
    } catch (error) {
      messageApi.error('Lỗi khi xóa token')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingToken) {
        await put(`/user/api-tokens/${editingToken._id}`, values)
        messageApi.success('Đã cập nhật token')
      } else {
        const response = await post('/user/api-tokens', values)
        if (response?.success && response.data?.fullToken) {
          const tokenId = response.data._id
          setNewToken(response.data.fullToken)
          // Lưu fullToken vào map để có thể copy sau này
          setFullTokensMap(prev => ({
            ...prev,
            [tokenId]: response.data.fullToken
          }))
          messageApi.success('Đã tạo token mới! Vui lòng lưu token này ngay.')
        }
      }
      setModalOpen(false)
      form.resetFields()
      fetchTokens()
    } catch (error) {
      messageApi.error('Lỗi khi lưu token')
    }
  }

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token)
    messageApi.success('Đã sao chép token')
  }

  const columns = [
    {
      title: 'Tên token',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      width: 100,
      render: (token, record) => {
        // Ưu tiên fullToken từ record, sau đó từ map, cuối cùng mới dùng masked token
        const fullToken = record.fullToken || fullTokensMap[record._id]
        const tokenToCopy = fullToken || token
        
        return (
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(tokenToCopy)
              messageApi.success(fullToken ? 'Đã sao chép token' : 'Đã sao chép token (masked)')
            }}
          >
            Copy
          </Button>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Hoạt động' : 'Đã tắt'}
        </Tag>
      ),
    },
    {
      title: 'Lần sử dụng',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 120,
      render: (count) => count || 0,
    },
    {
      title: 'Lần cuối sử dụng',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 180,
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="!space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tài liệu API</h1>
        <p className="text-slate-600 mt-1">
          Quản lý API tokens và xem tài liệu sử dụng API
        </p>
      </div>

      {/* API Documentation */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ApiOutlined />
            <span>Tài liệu API</span>
          </div>
        }
      >
        <div className="space-y-4">
          <Alert
            title="Cách sử dụng API"
            description={
              <div className="space-y-2 mt-2">
                <p>1. Tạo API token bên dưới</p>
                <p>2. Sử dụng token trong header của request:</p>
                <Paragraph className="mt-2">
                  <Text code>
                    Authorization: Bearer YOUR_TOKEN_HERE
                  </Text>
                </Paragraph>
                <p className="mt-2">
                  3. Mỗi API call thành công sẽ được tính phí dựa trên cấu hình
                </p>
              </div>
            }
            type="info"
            showIcon
          />

          <Divider />

          <div>
            <h3 className="font-semibold mb-2">Base URL</h3>
            <Text code>{import.meta.env.VITE_API_BASE_URL || 'https://api.autopee.com'}</Text>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Ví dụ sử dụng</h3>
            <TextArea
              value={`curl -X GET "${import.meta.env.VITE_API_BASE_URL || 'https://api.autopee.com'}/api/endpoint" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`}
              readOnly
              rows={3}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </Card>

      {/* API Tokens Management */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ApiOutlined />
            <span>API Tokens</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Tạo token mới
          </Button>
        }
      >
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có API token. Vui lòng tạo token để sử dụng API.
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={tokens}
            rowKey="_id"
            loading={loading}
            pagination={false}
          />
        )}
      </Card>

      {/* Modal Create/Edit Token */}
      <Modal
        title={editingToken ? 'Sửa token' : 'Tạo token mới'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setNewToken(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        {newToken ? (
          <div className="space-y-4">
            <Alert
              title="Token đã được tạo thành công!"
              description="Vui lòng lưu token này ngay. Bạn sẽ không thể xem lại token sau khi đóng modal này."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
            <div>
              <label className="block text-sm font-medium mb-2">API Token:</label>
              <div className="flex gap-2">
                <Input
                  value={newToken}
                  readOnly
                  className="font-mono"
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyToken(newToken)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Button
              type="primary"
              block
              onClick={() => {
                setModalOpen(false)
                setNewToken(null)
                form.resetFields()
              }}
            >
              Đã lưu token
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Tên token"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên token' }]}
            >
              <Input placeholder="Ví dụ: Production API, Development API" />
            </Form.Item>

            {editingToken && (
              <Form.Item
                label="Trạng thái"
                name="isActive"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Đã tắt" />
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingToken ? 'Cập nhật' : 'Tạo token'}
                </Button>
                <Button onClick={() => {
                  setModalOpen(false)
                  form.resetFields()
                }}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default ApiSettings

