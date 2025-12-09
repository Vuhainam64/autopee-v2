import { useState } from 'react'
import { Card, Button, Table, Modal, Form, Input, Select, Checkbox, App, message } from 'antd'
import { PlusOutlined, BankOutlined, HistoryOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext.jsx'

const { Option } = Select

// Mock data - sẽ thay bằng API thật sau
const mockBankAccounts = [
  {
    id: '1',
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountHolder: 'Nguyễn Văn A',
    isDefault: true,
  },
  {
    id: '2',
    bankName: 'Techcombank',
    accountNumber: '0987654321',
    accountHolder: 'Nguyễn Văn A',
    isDefault: false,
  },
]

const mockTransactions = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'Nạp tiền',
    amount: 1000000,
    status: 'Thành công',
    description: 'Nạp tiền vào ví',
  },
  {
    id: '2',
    date: '2024-01-10',
    type: 'Rút tiền',
    amount: -500000,
    status: 'Thành công',
    description: 'Rút tiền về tài khoản ngân hàng',
  },
]

function WalletSettings() {
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [form] = Form.useForm()
  const { currentUser } = useAuth()
  const { message: messageApi } = App.useApp()

  const bankColumns = [
    {
      title: 'Ngân hàng',
      dataIndex: 'bankName',
      key: 'bankName',
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
      render: (isDefault) => (isDefault ? 'Có' : 'Không'),
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
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className={amount > 0 ? 'text-green-600' : 'text-red-600'}>
          {amount > 0 ? '+' : ''}
          {amount.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className="text-green-600">{status}</span>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
  ]

  const handleAddBank = async (values) => {
    try {
      // TODO: Call API to add bank account
      console.log('Add bank account:', values)
      messageApi.success('Thêm tài khoản ngân hàng thành công!')
      form.resetFields()
      setBankModalOpen(false)
    } catch (error) {
      messageApi.error('Thêm tài khoản ngân hàng thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
        <Table
          dataSource={mockBankAccounts}
          columns={bankColumns}
          rowKey="id"
          pagination={false}
        />
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
          dataSource={mockTransactions}
          columns={transactionColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal thêm tài khoản ngân hàng */}
      <Modal
        open={bankModalOpen}
        onCancel={() => {
          setBankModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        title="Thêm tài khoản ngân hàng"
        width={520}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddBank}
          className="mt-4"
        >
          <Form.Item
            label="Ngân hàng"
            name="bankName"
            rules={[{ required: true, message: 'Vui lòng chọn ngân hàng!' }]}
          >
            <Select size="large" placeholder="Chọn ngân hàng">
              <Option value="Vietcombank">Vietcombank</Option>
              <Option value="Techcombank">Techcombank</Option>
              <Option value="BIDV">BIDV</Option>
              <Option value="Vietinbank">Vietinbank</Option>
              <Option value="ACB">ACB</Option>
              <Option value="TPBank">TPBank</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số tài khoản"
            name="accountNumber"
            rules={[
              { required: true, message: 'Vui lòng nhập số tài khoản!' },
              {
                pattern: /^[0-9]{8,15}$/,
                message: 'Số tài khoản không hợp lệ!',
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Nhập số tài khoản"
              maxLength={15}
            />
          </Form.Item>

          <Form.Item
            label="Chủ tài khoản"
            name="accountHolder"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản!' }]}
          >
            <Input size="large" placeholder="Nhập tên chủ tài khoản" />
          </Form.Item>

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
      </Modal>
    </div>
  )
}

export default WalletSettings

