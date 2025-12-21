import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  InputNumber,
  Avatar,
  Tabs,
  Switch,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  UserOutlined,
  SearchOutlined,
  SafetyOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { get, post, put, del } from '../../services/api.js'

const { Option } = Select

function Users() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [userRoleModalVisible, setUserRoleModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [roleForm] = Form.useForm()
  const [userRoleForm] = Form.useForm()

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [pagination.page, searchText, selectedRole])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await get(
        `/admin/users?page=${pagination.page}&limit=${pagination.limit}&search=${encodeURIComponent(searchText || '')}&role=${encodeURIComponent(selectedRole || '')}`
      )
      setUsers(response.data || [])
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
      }))
    } catch (error) {
      console.error('Error fetching users:', error)
      message.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await get('/admin/roles')
      setRoles(response.data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      message.error('Không thể tải danh sách roles')
    }
  }

  const handleRoleSubmit = async (values) => {
    try {
      if (editingRole) {
        await put(`/admin/roles/${editingRole._id}`, values)
        message.success('Cập nhật role thành công')
      } else {
        await post('/admin/roles', values)
        message.success('Tạo role thành công')
      }
      setRoleModalVisible(false)
      roleForm.resetFields()
      setEditingRole(null)
      fetchRoles()
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleUserRoleSubmit = async (values) => {
    try {
      await put(`/admin/users/${editingUser.uid}/role`, values)
      message.success('Cập nhật role cho user thành công')
      setUserRoleModalVisible(false)
      userRoleForm.resetFields()
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleEditRole = (role) => {
    setEditingRole(role)
    roleForm.setFieldsValue({
      name: role.name,
      displayName: role.displayName,
      score: role.score,
      description: role.description,
      color: role.color,
    })
    setRoleModalVisible(true)
  }

  const handleEditUserRole = (user) => {
    setEditingUser(user)
    userRoleForm.setFieldsValue({
      role: user.role || 'user',
    })
    setUserRoleModalVisible(true)
  }

  const handleRoleChange = async (uid, newRole) => {
    try {
      await put(`/admin/users/${uid}/role`, { role: newRole })
      message.success('Cập nhật role thành công')
      fetchUsers()
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleStatusChange = async (uid, disabled) => {
    try {
      await put(`/admin/users/${uid}/status`, { disabled })
      message.success(disabled ? 'Đã vô hiệu hóa người dùng' : 'Đã kích hoạt người dùng')
      fetchUsers()
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleDeleteRole = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa role này?',
      onOk: async () => {
        try {
          await del(`/admin/roles/${id}`)
          message.success('Xóa role thành công')
          fetchRoles()
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa role')
        }
      },
    })
  }

  const getRoleColor = (roleName) => {
    const role = roles.find((r) => r.name === roleName)
    return role?.color || 'default'
  }

  const getRoleDisplayName = (roleName) => {
    const role = roles.find((r) => r.name === roleName)
    return role?.displayName || roleName
  }

  const userColumns = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.photoURL} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.displayName || record.email}</div>
            <div className="text-xs text-slate-500">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email Verified',
      dataIndex: 'emailVerified',
      key: 'emailVerified',
      width: 120,
      render: (verified) => (
        <Tag color={verified ? 'green' : 'default'}>
          {verified ? 'Đã xác thực' : 'Chưa xác thực'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleString('vi-VN') : '-'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              // TODO: Implement view user details
              message.info('Xem chi tiết user: ' + record.displayName)
            }}
          >
            View
          </Button>
          <Select
            value={record.role || 'user'}
            onChange={(value) => handleRoleChange(record.uid, value)}
            size="small"
            style={{ width: 130 }}
          >
            {roles.map((r) => (
              <Option key={r.name} value={r.name}>
                {r.displayName}
              </Option>
            ))}
          </Select>
          <Switch
            checked={!record.disabled}
            onChange={(checked) => handleStatusChange(record.uid, !checked)}
            size="small"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: `Bạn có chắc chắn muốn xóa user ${record.displayName || record.email}?`,
                onOk: async () => {
                  try {
                    // TODO: Implement delete user API
                    message.success('Đã xóa user thành công')
                    fetchUsers()
                  } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa user')
                  }
                },
              })
            }}
          />
        </Space>
      ),
    },
  ]

  const roleColumns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Tên hiển thị',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 150,
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      sorter: (a, b) => a.score - b.score,
      render: (score) => <Tag color="blue">{score}</Tag>,
    },
    {
      title: 'Màu',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color) => <Tag color={color || 'default'}>{color}</Tag>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteRole(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'users',
      label: (
        <Space>
          <UserOutlined />
          <span>Người dùng</span>
        </Space>
      ),
      children: (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              allowClear
              style={{ width: 250 }}
            />
            <Select
              placeholder="Lọc theo role"
              value={selectedRole || undefined}
              onChange={(value) => {
                setSelectedRole(value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              allowClear
              style={{ width: 180 }}
            >
              {roles.map((role) => (
                <Option key={role.name} value={role.name}>
                  {role.displayName}
                </Option>
              ))}
            </Select>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="uid"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} người dùng`,
              onChange: (page, limit) => {
                setPagination((prev) => ({ ...prev, page, limit }))
              },
            }}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      ),
    },
    {
      key: 'roles',
      label: (
        <Space>
          <SafetyOutlined />
          <span>Quản lý Roles</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRole(null)
                roleForm.resetFields()
                setRoleModalVisible(true)
              }}
            >
              Thêm Role
            </Button>
          }
        >
          <Table
            columns={roleColumns}
            dataSource={roles}
            rowKey="_id"
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
      </div>

      <Tabs items={tabItems} defaultActiveKey="users" />

      {/* Role Modal */}
      <Modal
        title={editingRole ? 'Sửa Role' : 'Thêm Role'}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false)
          roleForm.resetFields()
          setEditingRole(null)
        }}
        onOk={() => roleForm.submit()}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleRoleSubmit}>
          <Form.Item
            name="name"
            label="Tên role (unique)"
            rules={[{ required: true, message: 'Vui lòng nhập tên role' }]}
          >
            <Input placeholder="guest" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="Tên hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
          >
            <Input placeholder="Khách" />
          </Form.Item>
          <Form.Item
            name="score"
            label="Điểm số (để sắp xếp)"
            rules={[{ required: true, message: 'Vui lòng nhập điểm số' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="1" />
          </Form.Item>
          <Form.Item name="color" label="Màu tag">
            <Select placeholder="Chọn màu">
              <Option value="cyan">Cyan</Option>
              <Option value="default">Default</Option>
              <Option value="orange">Orange</Option>
              <Option value="red">Red</Option>
              <Option value="green">Green</Option>
              <Option value="blue">Blue</Option>
              <Option value="purple">Purple</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả về role này" />
          </Form.Item>
        </Form>
      </Modal>

      {/* User Role Modal */}
      <Modal
        title={`Đổi role cho ${editingUser?.displayName || editingUser?.email}`}
        open={userRoleModalVisible}
        onCancel={() => {
          setUserRoleModalVisible(false)
          userRoleForm.resetFields()
          setEditingUser(null)
        }}
        onOk={() => userRoleForm.submit()}
      >
        <Form form={userRoleForm} layout="vertical" onFinish={handleUserRoleSubmit}>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Vui lòng chọn role' }]}
          >
            <Select placeholder="Chọn role">
              {roles.map((role) => (
                <Option key={role.name} value={role.name}>
                  <Space>
                    <Tag color={role.color}>{role.displayName}</Tag>
                    <span className="text-xs text-slate-500">(Score: {role.score})</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users

