import React, { useState, useEffect } from 'react'
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  Card,
  Upload,
  message,
  App,
  Tooltip,
  Popconfirm,
  Empty,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  CopyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { get, post, put, del } from '../../services/api.js'
import dayjs from 'dayjs'

const { Content, Sider } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const AccountManagement = () => {
  const { message: messageApi } = App.useApp()
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [form] = Form.useForm()
  const [importForm] = Form.useForm()
  const [accountForm] = Form.useForm()
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [collectionSearch, setCollectionSearch] = useState('')
  const [accountSearch, setAccountSearch] = useState('')
  const [siderCollapsed, setSiderCollapsed] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  })

  // Load collections
  const loadCollections = async () => {
    try {
      const response = await get('/account/collections')
      if (response?.success) {
        setCollections(response.data || [])
        // Tự động chọn collection đầu tiên nếu chưa có collection nào được chọn
        if (!selectedCollection && response.data && response.data.length > 0) {
          setSelectedCollection(response.data[0]._id)
        }
      }
    } catch (error) {
      messageApi.error('Không thể tải danh sách collections')
    }
  }

  // Load accounts
  const loadAccounts = async (collectionId, page = 1) => {
    if (!collectionId) {
      setAccounts([])
      return
    }

    try {
      setLoading(true)
      const response = await get(
        `/account/collections/${collectionId}/accounts?page=${page}&limit=${pagination.pageSize}`
      )
      if (response?.success) {
        setAccounts(response.data.accounts || [])
        setPagination({
          ...pagination,
          current: page,
          total: response.data.pagination?.total || 0,
        })
      }
    } catch (error) {
      messageApi.error('Không thể tải danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollections()
  }, [])

  useEffect(() => {
    if (selectedCollection) {
      loadAccounts(selectedCollection, pagination.current)
    }
  }, [selectedCollection, pagination.current])

  // Collection handlers
  const handleCreateCollection = () => {
    setEditingCollection(null)
    form.resetFields()
    setCollectionModalOpen(true)
  }

  const handleEditCollection = (collection) => {
    setEditingCollection(collection)
    form.setFieldsValue({
      name: collection.name,
      description: collection.description || '',
    })
    setCollectionModalOpen(true)
  }

  const handleDeleteCollection = async (collectionId) => {
    try {
      await del(`/account/collections/${collectionId}`)
      messageApi.success('Đã xóa collection')
      if (selectedCollection === collectionId) {
        setSelectedCollection(null)
        setAccounts([])
      }
      await loadCollections()
    } catch (error) {
      messageApi.error('Không thể xóa collection')
    }
  }

  const handleSubmitCollection = async () => {
    try {
      const values = await form.validateFields()
      if (editingCollection) {
        await put(`/account/collections/${editingCollection._id}`, values)
        messageApi.success('Đã cập nhật collection')
      } else {
        await post('/account/collections', values)
        messageApi.success('Đã tạo collection')
      }
      setCollectionModalOpen(false)
      await loadCollections()
    } catch (error) {
      messageApi.error('Không thể lưu collection')
    }
  }

  // Import handlers
  const handleImportCookies = () => {
    if (!selectedCollection) {
      messageApi.warning('Vui lòng chọn collection trước')
      return
    }
    importForm.resetFields()
    setImportModalOpen(true)
  }

  const handleFileUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      importForm.setFieldsValue({ cookies: content })
    }
    reader.readAsText(file)
    return false // Prevent auto upload
  }

  const handleSubmitImport = async () => {
    try {
      const values = await importForm.validateFields()
      setLoading(true)
      const response = await post(
        `/account/collections/${selectedCollection}/accounts/import`,
        {
          cookies: values.cookies,
          importType: 'textarea',
        }
      )

      if (response?.success) {
        messageApi.success(
          `Đã import ${response.data.imported} tài khoản. ${response.data.errors > 0 ? `Có ${response.data.errors} lỗi.` : ''}`
        )
        setImportModalOpen(false)
        await loadAccounts(selectedCollection, 1)
        await loadCollections()
      }
    } catch (error) {
      messageApi.error('Không thể import cookies')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async (accountId) => {
    try {
      await del(`/account/collections/${selectedCollection}/accounts/${accountId}`)
      messageApi.success('Đã xóa tài khoản')
      await loadAccounts(selectedCollection, pagination.current)
      await loadCollections()
    } catch (error) {
      messageApi.error('Không thể xóa tài khoản')
    }
  }

  const handleViewAccount = (account) => {
    setCurrentAccount(account)
    accountForm.setFieldsValue({
      username: account.username || '',
      email: account.email || '',
      phone: account.phone || '',
      nickname: account.nickname || '',
      spcF: account.spcF || '',
      spcSt: account.spcSt || '',
      password: account.password || '',
      cookieFull: account.cookieFull || '',
    })
    setAccountModalOpen(true)
  }

  const handleSubmitAccount = async () => {
    try {
      const values = await accountForm.validateFields()
      if (!currentAccount) return
      setLoading(true)
      const response = await put(
        `/account/collections/${selectedCollection}/accounts/${currentAccount._id}`,
        values
      )
      if (response?.success) {
        messageApi.success('Đã cập nhật tài khoản')
        setAccountModalOpen(false)
        setCurrentAccount(null)
        await loadAccounts(selectedCollection, pagination.current)
        await loadCollections()
      }
    } catch (error) {
      messageApi.error('Không thể cập nhật tài khoản')
    } finally {
      setLoading(false)
    }
  }

  // Truncate text helper
  const truncateText = (text, maxLength = 20) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const filteredCollections = collections.filter((c) =>
    c.name?.toLowerCase().includes(collectionSearch.toLowerCase())
  )

  const filteredAccounts = accounts.filter((acc) => {
    const keyword = accountSearch.toLowerCase()
    if (!keyword) return true
    return (
      (acc.username || '').toLowerCase().includes(keyword) ||
      (acc.email || '').toLowerCase().includes(keyword) ||
      (acc.phone || '').toLowerCase().includes(keyword) ||
      (acc.spcF || '').toLowerCase().includes(keyword) ||
      (acc.spcSt || '').toLowerCase().includes(keyword)
    )
  })

  // Table columns
  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (text) => (
        <Tooltip title={text || '-'}>
          <Text>{truncateText(text || '-')}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text) => (
        <Tooltip title={text || '-'}>
          <Text>{truncateText(text || '-')}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text) => (
        <Tooltip title={text || '-'}>
          <Text>{truncateText(text || '-')}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'SPC_F',
      dataIndex: 'spcF',
      key: 'spcF',
      width: 200,
      render: (text) => (
        <Tooltip title={text || '-'}>
          <Text code copyable={{ text: text || '' }}>
            {truncateText(text || '-')}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'SPC_ST',
      dataIndex: 'spcSt',
      key: 'spcSt',
      width: 300,
      render: (text) => (
        <Tooltip title={text || '-'}>
          <Text code copyable={{ text: text || '' }}>
            {truncateText(text || '-', 30)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const handleCopy = () => {
          const format = `${record.username || ''}|${record.password || ''}|${record.spcF || ''}|${record.spcSt || ''}`
          navigator.clipboard.writeText(format)
          messageApi.success('Đã copy định dạng username|password|spc_f|spc_st')
        }
        
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => handleViewAccount(record)}
            >
              Xem
            </Button>
            <Tooltip title="Copy định dạng username|password|spc_f|spc_st">
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                onClick={handleCopy}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa tài khoản này?"
              onConfirm={() => handleDeleteAccount(record._id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Sider
        width={250}
        collapsible
        collapsed={siderCollapsed}
        onCollapse={(val) => setSiderCollapsed(val)}
        collapsedWidth={64}
        trigger={null}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          padding: '16px',
        }}
      >
        {siderCollapsed ? (
          <div className="flex flex-col gap-3 mb-4">
            <Button
              type="text"
              size="small"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setSiderCollapsed(false)}
              style={{ width: '100%' }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleCreateCollection}
              style={{ width: '100%' }}
            />
            <div className="flex flex-col gap-2 items-center">
              {filteredCollections.map((collection) => {
                const isActive = selectedCollection === collection._id
                return (
                  <Tooltip key={collection._id} title={collection.name}>
                    <Button
                      type={isActive ? 'primary' : 'text'}
                      icon={<FolderOutlined />}
                      size="large"
                      shape="circle"
                      onClick={() => setSelectedCollection(collection._id)}
                    />
                  </Tooltip>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Title level={5} style={{ margin: 0 }}>
                Collections
              </Title>
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined />}
                onClick={() => setSiderCollapsed(true)}
              />
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size="small"
                placeholder="Tìm collection"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                allowClear
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleCreateCollection}
              />
            </Space.Compact>
          </div>
        )}

        {!siderCollapsed && (
          <div className="!space-y-2">
            {filteredCollections.length === 0 ? (
              <Empty
                description="Chưa có collection"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '20px 0' }}
              />
            ) : (
              filteredCollections.map((collection) => (
                <Card
                  key={collection._id}
                  size="small"
                  hoverable
                  onClick={() => setSelectedCollection(collection._id)}
                  style={{
                    cursor: 'pointer',
                    border:
                      selectedCollection === collection._id
                        ? '2px solid #ff6b35'
                        : '1px solid #f0f0f0',
                    backgroundColor:
                      selectedCollection === collection._id ? '#fff7ed' : '#fff',
                  }}
                  actions={[
                    <EditOutlined
                      key="edit"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCollection(collection)
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="Xóa collection này?"
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        handleDeleteCollection(collection._id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteOutlined
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <div>
                    <Text strong>{collection.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {collection.accountCount || 0} tài khoản
                    </Text>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Sider>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        {selectedCollection ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <Title level={4} style={{ margin: 0 }}>
                Danh sách tài khoản
              </Title>
              <Space size="small" wrap>
                <Input
                  placeholder="Tìm tài khoản (user/email/phone/spc)"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  allowClear
                  style={{ width: 260 }}
                />
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleImportCookies}
                >
                  Import Cookie
                </Button>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={filteredAccounts}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: false,
                showTotal: (total) => `Tổng ${total} tài khoản`,
              }}
              scroll={{ x: 1200 }}
              onChange={(pagination) => {
                loadAccounts(selectedCollection, pagination.current)
              }}
            />
          </>
        ) : (
          <Empty
            description="Vui lòng chọn hoặc tạo collection"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: '100px' }}
          />
        )}
      </Content>

      {/* Collection Modal */}
      <Modal
        title={editingCollection ? 'Chỉnh sửa Collection' : 'Tạo Collection mới'}
        open={collectionModalOpen}
        onOk={handleSubmitCollection}
        onCancel={() => {
          setCollectionModalOpen(false)
          setEditingCollection(null)
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên collection"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Collection 1" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả collection..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Cookies"
        open={importModalOpen}
        onOk={handleSubmitImport}
        onCancel={() => setImportModalOpen(false)}
        width={800}
        confirmLoading={loading}
      >
        <Form form={importForm} layout="vertical">
          <Form.Item
            name="cookies"
            label="Cookies (mỗi cookie một dòng)"
            rules={[{ required: true, message: 'Vui lòng nhập cookies' }]}
          >
            <TextArea
              rows={10}
              placeholder={`Định dạng phone|password|spc_f`}
            />
          </Form.Item>
          <Form.Item>
            <Upload
              beforeUpload={handleFileUpload}
              showUploadList={false}
              accept=".txt"
            >
              <Button icon={<FileTextOutlined />}>Chọn file .txt</Button>
            </Upload>
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ display: 'block' }}>
                Hỗ trợ import từ file .txt, mỗi cookie một dòng
              </Text>
              <Text type="secondary" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
                <strong>Lưu ý:</strong> Để convert SPC_F sang SPC_ST, vui lòng nhập định dạng: <Text code>phone|password|spc_f</Text>
              </Text>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Account Detail / Edit Modal */}
      <Modal
        title="Chi tiết tài khoản"
        open={accountModalOpen}
        onOk={handleSubmitAccount}
        onCancel={() => {
          setAccountModalOpen(false)
          setCurrentAccount(null)
        }}
        confirmLoading={loading}
        destroyOnClose
        width={700}
      >
        <Form form={accountForm} layout="vertical">
          <Form.Item label="Username" name="username">
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="email" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="phone" />
          </Form.Item>
          <Form.Item label="Nickname" name="nickname">
            <Input placeholder="nickname" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password placeholder="password" />
          </Form.Item>
          <Form.Item label="SPC_F" name="spcF">
            <TextArea rows={2} placeholder="SPC_F" />
          </Form.Item>
          <Form.Item label="SPC_ST" name="spcSt">
            <TextArea rows={2} placeholder="SPC_ST" />
          </Form.Item>
          <Form.Item label="Cookie Full" name="cookieFull">
            <TextArea rows={4} placeholder="Cookie đầy đủ" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default AccountManagement

