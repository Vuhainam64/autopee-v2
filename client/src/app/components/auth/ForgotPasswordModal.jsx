import { useState } from 'react'
import { Modal, Form, Input, Button, App } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext.jsx'

function ForgotPasswordModal({ open, onClose, onSwitchToLogin }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const { message } = App.useApp()

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      await resetPassword(values.email)
      message.success(
        'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.',
      )
      form.resetFields()
      onClose()
    } catch (error) {
      let errorMessage = 'Gửi email thất bại. Vui lòng thử lại.'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Không tìm thấy tài khoản với email này.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.'
      }
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Nhập email để nhận link đặt lại mật khẩu
          </p>
        </div>
      }
      width={520}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-6"
        id="forgot-password-form"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-slate-400" />}
            placeholder="Email"
            size="large"
            id="forgot-email"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="bg-orange-500 hover:bg-orange-600"
          >
            Gửi email đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-4 text-center text-sm text-slate-600">
        Nhớ mật khẩu?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
        >
          Đăng nhập ngay
        </button>
      </div>
    </Modal>
  )
}

export default ForgotPasswordModal

