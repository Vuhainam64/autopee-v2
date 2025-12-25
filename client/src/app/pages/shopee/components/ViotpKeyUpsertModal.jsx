import { useState } from 'react'
import { App, Form, Input, Modal } from 'antd'
import { post } from '../../../services/api.js'

export default function ViotpKeyUpsertModal({ open, onClose, onSaved }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const res = await post('/viotp/keys', {
        name: values.name,
        token: values.token,
      })

      if (res?.success) {
        message.success('Đã lưu key')
        form.resetFields()
        onSaved?.()
      } else {
        message.error(res?.error?.message || 'Lưu key thất bại')
      }
    } catch (e) {
      if (e?.errorFields) return
      message.error(e?.message || 'Lưu key thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Thêm VIOTP Key"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
        >
          <Input placeholder="Ví dụ: Key chính" maxLength={100} />
        </Form.Item>
        <Form.Item
          label="Token"
          name="token"
          rules={[{ required: true, message: 'Vui lòng nhập token' }]}
        >
          <Input placeholder="Nhập token VIOTP" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

