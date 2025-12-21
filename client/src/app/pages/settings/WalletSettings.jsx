import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Table, Modal, Form, Input, Select, Checkbox, App, Tag, Spin } from 'antd'
import { PlusOutlined, BankOutlined, HistoryOutlined, WalletOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { bankList } from '../../utils/banks.js'
import DepositModal from '../../components/payment/DepositModal.jsx'
import PendingPaymentsCard from '../../components/payment/PendingPaymentsCard.jsx'
import { post, get } from '../../services/api.js'
import { useAppSelector } from '../../store/hooks.js'

const { Option } = Select

// Function to remove accents and convert to uppercase
const removeAccentsAndUpperCase = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Removes accents
    .replace(/[0-9]/g, '') // Removes numbers
    .replace(/[^a-zA-Z\s]/g, '')
    .toUpperCase() // Converts to uppercase
}

function WalletSettings() {
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [bankAccounts, setBankAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [pendingPayments, setPendingPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState(null)
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null)
  const [form] = Form.useForm()
  const { currentUser } = useAuth()
  const { message: messageApi } = App.useApp()
  const userProfile = useAppSelector((state) => state.user.userProfile)

  // Reset form khi modal đóng
  useEffect(() => {
    if (!bankModalOpen) {
      form.resetFields()
      setSelectedBank(null)
    }
  }, [bankModalOpen, form])

  // Lấy số dư hiện tại
  const currentBalance = userProfile?.walletBalance || 0

  // Load bank accounts và transactions
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // TODO: Load bank accounts từ API khi có
      // const bankAccountsRes = await get('/user/bank-accounts')
      // setBankAccounts(bankAccountsRes.data || [])

      // Load transactions và pending payments
      await Promise.all([loadTransactions(), loadPendingPayments()])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingPayments = useCallback(async () => {
    try {
      const response = await get('/payment/deposit/history?status=pending&limit=10')
      if (response.success && response.data?.paymentRequests) {
        setPendingPayments(response.data.paymentRequests)
      }
    } catch (error) {
      console.error('Error loading pending payments:', error)
    }
  }, [])

  const loadTransactions = async () => {
    setTransactionsLoading(true)
    try {
      const response = await get('/user/transactions?limit=50')
      if (response.success && response.data?.transactions) {
        setTransactions(response.data.transactions)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }

  const bankColumns = [
    {
      title: 'Ngân hàng',
      dataIndex: 'bankName',
      key: 'bankName',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          {record.bankLogo && (
            <img src={record.bankLogo} alt={text} className="w-6 h-6" />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Số tài khoản',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
    },
    {
      title: 'Chủ tài khoản',
      dataIndex: 'accountHolder',
      key: 'accountHolder',
    },
    {
      title: 'Mặc định',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault) => (
        <Tag color={isDefault ? 'green' : 'default'}>
          {isDefault ? 'Có' : 'Không'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button type="link" size="small">
            Sửa
          </Button>
          <Button type="link" danger size="small">
            Xóa
          </Button>
        </div>
      ),
    },
  ]

  const transactionColumns = [
    {
      title: 'Ngày',
      dataIndex: 'transactionDate',
      key: 'date',
      render: (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString('vi-VN')
      },
    },
    {
      title: 'Loại',
      dataIndex: 'transferType',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'in' ? 'green' : 'red'}>
          {type === 'in' ? 'Nạp tiền' : 'Rút tiền'}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'transferAmount',
      key: 'amount',
      render: (amount, record) => (
        <span className={record.transferType === 'in' ? 'text-green-600' : 'text-red-600'}>
          {record.transferType === 'in' ? '+' : '-'}
          {amount.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'orange', text: 'Đang xử lý' },
          processed: { color: 'green', text: 'Thành công' },
          failed: { color: 'red', text: 'Thất bại' },
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'content',
      key: 'description',
      render: (content) => content || '-',
    },
  ]

  const handleBankChange = (value) => {
    const bank = bankList.find((bank) => bank.id === value)
    setSelectedBank(bank)
  }

  const handleBankAccountChange = (e) => {
    const normalizedAccountName = removeAccentsAndUpperCase(e.target.value)
    form.setFieldsValue({ accountHolder: normalizedAccountName })
  }

  const handleBankNumberChange = (e) => {
    const sanitizedNumber = e.target.value.replace(/[^0-9]/g, '')
    form.setFieldsValue({ accountNumber: sanitizedNumber })
  }

  const handleAddBank = async (values) => {
    try {
      // TODO: Call API to add bank account
      // const response = await post('/user/bank-accounts', {
      //   bankName: selectedBank.name,
      //   bankCode: selectedBank.code,
      //   accountNumber: values.accountNumber,
      //   accountHolder: values.accountHolder,
      //   isDefault: values.isDefault || false,
      // })
      console.log('Add bank account:', { ...values, bank: selectedBank })
      messageApi.success('Thêm tài khoản ngân hàng thành công!')
      form.resetFields()
      setBankModalOpen(false)
      setSelectedBank(null)
    } catch (error) {
      messageApi.error('Thêm tài khoản ngân hàng thất bại. Vui lòng thử lại.')
    }
  }

  const handleDepositSuccess = () => {
    loadTransactions()
    loadPendingPayments()
    // Reload user profile để cập nhật balance
    window.location.reload() // Tạm thời, có thể dùng state management tốt hơn
  }

  const handleContinuePayment = (paymentRequest) => {
    setSelectedPaymentRequest(paymentRequest)
    setDepositModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl !space-y-6">
      {/* Số dư hiện tại */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Số dư hiện tại</div>
            <div className="text-3xl font-bold text-orange-600">
              {currentBalance.toLocaleString('vi-VN')} đ
            </div>
          </div>
          <Button
            type="primary"
            icon={<WalletOutlined />}
            onClick={() => {
              setSelectedPaymentRequest(null)
              setDepositModalOpen(true)
            }}
            className="bg-orange-500 hover:bg-orange-600"
            size="large"
          >
            Nạp tiền
          </Button>
        </div>
      </Card>

      {/* Đơn chờ thanh toán */}
      {pendingPayments.length > 0 && (
        <PendingPaymentsCard
          payments={pendingPayments}
          onContinuePayment={handleContinuePayment}
        />
      )}

      {/* Tài khoản ngân hàng */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <BankOutlined />
            <span>Tài khoản ngân hàng</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBankModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Thêm tài khoản
          </Button>
        }
      >
        {bankAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có tài khoản ngân hàng. Vui lòng thêm tài khoản để rút tiền.
          </div>
        ) : (
          <Table
            dataSource={bankAccounts}
            columns={bankColumns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      {/* Lịch sử giao dịch */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined />
            <span>Lịch sử giao dịch</span>
          </div>
        }
      >
        <Table
          dataSource={transactions}
          columns={transactionColumns}
          rowKey="_id"
          loading={transactionsLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal thêm tài khoản ngân hàng */}
      <Modal
        open={bankModalOpen}
        onCancel={() => {
          setBankModalOpen(false)
          form.resetFields()
          setSelectedBank(null)
        }}
        footer={null}
        title="Thêm tài khoản ngân hàng"
        width={600}
        centered
        destroyOnHidden
      >
        {bankModalOpen && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddBank}
            className="mt-4"
          >
          <Form.Item
            label="Chủ tài khoản (Tiếng Việt KHÔNG DẤU)"
            name="accountHolder"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản!' }]}
          >
            <Input
              size="large"
              placeholder="Nhập tên chủ tài khoản"
              onChange={handleBankAccountChange}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <div className="text-xs text-gray-500 mb-4 -mt-2">
                Giá trị: {form.getFieldValue('accountHolder') || '(chưa nhập)'}
              </div>
            )}
          </Form.Item>

          <Form.Item
            label="Số tài khoản"
            name="accountNumber"
            rules={[
              { required: true, message: 'Vui lòng nhập số tài khoản!' },
              {
                pattern: /^[0-9]{8,15}$/,
                message: 'Số tài khoản phải từ 8-15 chữ số!',
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Nhập số tài khoản"
              maxLength={15}
              onChange={handleBankNumberChange}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {() => (
              <div className="text-xs text-gray-500 mb-4 -mt-2">
                Giá trị: {form.getFieldValue('accountNumber') || '(chưa nhập)'}
              </div>
            )}
          </Form.Item>

          <Form.Item
            label="Ngân hàng"
            name="bankId"
            rules={[{ required: true, message: 'Vui lòng chọn ngân hàng!' }]}
          >
            <Select
              size="large"
              placeholder="Chọn ngân hàng"
              onChange={handleBankChange}
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {bankList
                .filter((bank) => bank.transferSupported === 1)
                .map((bank) => (
                  <Option key={bank.id} value={bank.id}>
                    <div className="flex items-center gap-2">
                      {bank.logo && (
                        <img src={bank.logo} alt={bank.name} className="w-5 h-5" />
                      )}
                      <span>
                        {bank.shortName} - {bank.name}
                      </span>
                    </div>
                  </Option>
                ))}
            </Select>
          </Form.Item>

          {selectedBank && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Mã ngân hàng:</span>
                <span className="font-semibold">{selectedBank.bin || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Swift code:</span>
                <span className="font-semibold">{selectedBank.swift_code || 'N/A'}</span>
              </div>
            </div>
          )}

          <Form.Item
            name="isDefault"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Đặt làm tài khoản mặc định</Checkbox>
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="bg-orange-500 hover:bg-orange-600"
            >
              Thêm tài khoản
            </Button>
          </Form.Item>
        </Form>
        )}
      </Modal>

      {/* Modal nạp tiền */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => {
          setDepositModalOpen(false)
          setSelectedPaymentRequest(null)
        }}
        onSuccess={handleDepositSuccess}
        initialPaymentRequest={selectedPaymentRequest}
      />
    </div>
  )
}

export default WalletSettings
