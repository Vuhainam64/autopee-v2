import { useState, useEffect } from 'react'
import { Card, Table, Tag, Input, Select, DatePicker, Space, Button, Typography, Tooltip, Tabs, Modal, Form, App, Popconfirm } from 'antd'
import { SearchOutlined, ReloadOutlined, FilterOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { get, post, put, del } from '../../services/api.js'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Text } = Typography

const levelColors = {
  info: 'blue',
  warn: 'orange',
  error: 'red',
  debug: 'default',
}

const methodColors = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
}

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  })
  const [filters, setFilters] = useState({
    level: '',
    userId: '',
    endpoint: '',
    traceId: '',
    errorCode: '',
    search: '',
    dateRange: null,
  })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      }

      if (filters.level) params.level = filters.level
      if (filters.userId) params.userId = filters.userId
      if (filters.endpoint) params.endpoint = filters.endpoint
      if (filters.traceId) params.traceId = filters.traceId
      if (filters.errorCode) params.errorCode = filters.errorCode
      if (filters.search) params.search = filters.search
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].startOf('day').toISOString()
        params.endDate = filters.dateRange[1].endOf('day').toISOString()
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await get(`/admin/logs?${queryString}`)

      if (response?.success && response?.data) {
        setLogs(response.data.logs || [])
        setPagination(response.data.pagination || pagination)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, pagination.limit])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const handleReset = () => {
    setFilters({
      level: '',
      userId: '',
      endpoint: '',
      traceId: '',
      errorCode: '',
      search: '',
      dateRange: null,
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleCopyTraceId = (traceId) => {
    navigator.clipboard.writeText(traceId)
    // Có thể thêm notification ở đây
  }

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss')}
        </Text>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => (
        <Tag color={levelColors[level] || 'default'}>{level.toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'INFO', value: 'info' },
        { text: 'WARN', value: 'warn' },
        { text: 'ERROR', value: 'error' },
        { text: 'DEBUG', value: 'debug' },
        { text: 'CLIENT_ERROR', value: 'client_error' },
      ],
      onFilter: (value, record) => record.level === value,
    },
    {
      title: 'Trace ID',
      dataIndex: 'traceId',
      key: 'traceId',
      width: 150,
      render: (traceId) =>
        traceId ? (
          <Tooltip title="Click để copy">
            <Text
              code
              style={{ fontSize: '11px', cursor: 'pointer' }}
              onClick={() => handleCopyTraceId(traceId)}
              className="hover:text-blue-600"
            >
              {traceId}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Error Code',
      dataIndex: 'errorCode',
      key: 'errorCode',
      width: 150,
      render: (errorCode) =>
        errorCode ? (
          <Tag color="red">{errorCode}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method) =>
        method ? (
          <Tag color={methodColors[method] || 'default'}>{method}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      ellipsis: true,
      render: (endpoint) => (
        <Tooltip title={endpoint}>
          <Text code style={{ fontSize: '12px' }}>
            {endpoint || '-'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message) => (
        <Tooltip title={message}>
          <Text>{message || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 200,
      ellipsis: true,
      render: (userId) =>
        userId ? (
          <Tooltip title={userId}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {userId.substring(0, 20)}...
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
      render: (ip) => <Text type="secondary">{ip || '-'}</Text>,
    },
    {
      title: 'Duration',
      dataIndex: ['metadata', 'duration'],
      key: 'duration',
      width: 100,
      render: (duration) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {duration || '-'}
        </Text>
      ),
    },
  ]

  // Component Log Config Tab
  const LogConfigTab = () => {
    const [configs, setConfigs] = useState([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingConfig, setEditingConfig] = useState(null)
    const [form] = Form.useForm()
    const { message: messageApi } = App.useApp()

    const fetchConfigs = async () => {
      setLoading(true)
      try {
        const response = await get('/admin/log-configs')
        if (response?.success) {
          setConfigs(response.data || [])
        }
      } catch (error) {
        messageApi.error('Lỗi khi tải danh sách config')
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchConfigs()
    }, [])

    const handleCreate = () => {
      setEditingConfig(null)
      form.resetFields()
      setModalOpen(true)
    }

    const handleEdit = (record) => {
      setEditingConfig(record)
      form.setFieldsValue(record)
      setModalOpen(true)
    }

    const handleDelete = async (id) => {
      try {
        await del(`/admin/log-configs/${id}`)
        messageApi.success('Đã xóa config')
        fetchConfigs()
      } catch (error) {
        messageApi.error('Lỗi khi xóa config')
      }
    }

    const handleSubmit = async (values) => {
      try {
        if (editingConfig) {
          await put(`/admin/log-configs/${editingConfig._id}`, values)
          messageApi.success('Đã cập nhật config')
        } else {
          await post('/admin/log-configs', values)
          messageApi.success('Đã tạo config')
        }
        setModalOpen(false)
        form.resetFields()
        fetchConfigs()
      } catch (error) {
        messageApi.error('Lỗi khi lưu config')
      }
    }

    const configColumns = [
      {
        title: 'Pattern',
        dataIndex: 'pattern',
        key: 'pattern',
        render: (text) => <Text code>{text}</Text>,
      },
      {
        title: 'Method',
        dataIndex: 'method',
        key: 'method',
        width: 100,
        render: (method) => (
          <Tag color={method === 'ALL' ? 'purple' : methodColors[method] || 'default'}>
            {method}
          </Tag>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'enabled',
        key: 'enabled',
        width: 120,
        render: (enabled) => (
          <Tag color={enabled ? 'green' : 'default'}>
            {enabled ? 'Bỏ qua log' : 'Ghi log'}
          </Tag>
        ),
      },
      {
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
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
      <div>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Cấu hình bỏ qua log</h3>
            <p className="text-sm text-gray-500">
              Quản lý danh sách endpoints không cần ghi log (được gọi thường xuyên)
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm config
          </Button>
        </div>

        <Table
          columns={configColumns}
          dataSource={configs}
          rowKey="_id"
          loading={loading}
          pagination={false}
        />

        <Modal
          title={editingConfig ? 'Sửa config' : 'Thêm config mới'}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              method: 'ALL',
              enabled: true,
            }}
          >
            <Form.Item
              label="Pattern"
              name="pattern"
              rules={[{ required: true, message: 'Vui lòng nhập pattern' }]}
              tooltip="Pattern có thể là exact path (ví dụ: /payment/deposit/:id/status) hoặc regex (ví dụ: ^/payment/.*/status$)"
            >
              <Input placeholder="/payment/deposit/:paymentCode/status" />
            </Form.Item>

            <Form.Item
              label="Method"
              name="method"
              rules={[{ required: true, message: 'Vui lòng chọn method' }]}
            >
              <Select>
                <Select.Option value="ALL">ALL (Tất cả)</Select.Option>
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="POST">POST</Select.Option>
                <Select.Option value="PUT">PUT</Select.Option>
                <Select.Option value="DELETE">DELETE</Select.Option>
                <Select.Option value="PATCH">PATCH</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="enabled"
            >
              <Select>
                <Select.Option value={true}>Bỏ qua log</Select.Option>
                <Select.Option value={false}>Ghi log</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
            >
              <Input.TextArea rows={3} placeholder="Mô tả về config này..." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingConfig ? 'Cập nhật' : 'Tạo mới'}
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
        </Modal>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Theo dõi Log Server</h1>
          <p className="text-slate-600 mt-1">Xem và theo dõi các hoạt động của server</p>
        </div>

        <Tabs
          defaultActiveKey="logs"
          items={[
            {
              key: 'logs',
              label: 'Logs',
              children: (
                <div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <Space wrap size="middle">
            <Input
              placeholder="Tìm kiếm theo message hoặc endpoint..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ width: 300 }}
              onPressEnter={handleSearch}
            />

            <Select
              placeholder="Chọn level"
              value={filters.level || undefined}
              onChange={(value) => handleFilterChange('level', value)}
              allowClear
              style={{ width: 120 }}
            >
              <Select.Option value="info">INFO</Select.Option>
              <Select.Option value="warn">WARN</Select.Option>
              <Select.Option value="error">ERROR</Select.Option>
              <Select.Option value="debug">DEBUG</Select.Option>
            </Select>

            <Input
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              style={{ width: 200 }}
            />

            <Input
              placeholder="Endpoint"
              value={filters.endpoint}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              style={{ width: 200 }}
            />

            <Input
              placeholder="Trace ID"
              value={filters.traceId}
              onChange={(e) => handleFilterChange('traceId', e.target.value)}
              style={{ width: 200 }}
            />

            <Input
              placeholder="Error Code"
              value={filters.errorCode}
              onChange={(e) => handleFilterChange('errorCode', e.target.value)}
              style={{ width: 150 }}
            />

            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />

            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Tìm kiếm
            </Button>

            <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
              Làm mới
            </Button>

            <Button icon={<FilterOutlined />} onClick={handleReset}>
              Đặt lại
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} logs`,
            pageSizeOptions: ['20', '50', '100', '200'],
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                page,
                limit: pageSize,
              }))
            },
          }}
          scroll={{ x: 'max-content' }}
        />
                </div>
              ),
            },
            {
              key: 'config',
              label: 'Cấu hình',
              children: <LogConfigTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default Logs

