import { useState } from 'react'
import { Modal, Form, Input, Button, App, Divider } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../contexts/AuthContext.jsx'

function LoginModal({ open, onClose, onSwitchToRegister, onSwitchToForgot }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const { message } = App.useApp()

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      await login(values.email, values.password)
      message.success('Đăng nhập thành công!')
      form.resetFields()
      onClose()
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.'
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Tài khoản đã bị vô hiệu hóa.'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Không tìm thấy tài khoản.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mật khẩu không đúng.'
      }
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true)
      await loginWithGoogle()
      message.success('Đăng nhập Google thành công!')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('Google login error:', error)
      let errorMessage = 'Đăng nhập Google thất bại. Vui lòng thử lại.'
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại.'
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Cửa sổ popup bị chặn. Vui lòng cho phép popup và thử lại.'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain này chưa được cấu hình trong Firebase. Vui lòng liên hệ quản trị viên.'
      } else if (error.message) {
        errorMessage = `Đăng nhập Google thất bại: ${error.message}`
      }
      
      message.error(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chào mừng bạn quay trở lại Autopee
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
        id="login-form"
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
            id="login-email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Mật khẩu"
            size="large"
            id="login-password"
          />
        </Form.Item>

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="bg-orange-500 hover:bg-orange-600"
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>

      <Divider className="my-4">hoặc</Divider>

      <Button
        icon={<FcGoogle />}
        onClick={handleGoogle}
        loading={googleLoading}
        block
        size="large"
      >
        Đăng nhập với Google
      </Button>

      <Divider className="my-4">hoặc</Divider>

      <div className="text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
        >
          Đăng ký ngay
        </button>
      </div>
    </Modal>
  )
}

export default LoginModal

