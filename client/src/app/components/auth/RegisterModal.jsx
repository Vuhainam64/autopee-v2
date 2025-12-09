import { useState } from 'react'
import { Modal, Form, Input, Button, App } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext.jsx'

function RegisterModal({ open, onClose, onSwitchToLogin }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { message } = App.useApp()

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      await register(values.email, values.password)
      message.success('Đăng ký thành công! Vui lòng đăng nhập.')
      form.resetFields()
      onClose()
      onSwitchToLogin()
    } catch (error) {
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email này đã được sử dụng.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.'
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
          <h2 className="text-2xl font-bold text-slate-900">Đăng ký</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tạo tài khoản mới để bắt đầu với Autopee
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
        id="register-form"
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
            id="register-email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Mật khẩu"
            size="large"
            id="register-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Xác nhận mật khẩu"
            size="large"
            id="register-confirm-password"
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
            Đăng ký
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-4 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
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

export default RegisterModal

