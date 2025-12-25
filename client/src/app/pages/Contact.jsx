import React, { useState } from 'react'
import { Card, Typography, Form, Input, Button, Space, Select, App } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { post } from '../services/api.js'

const { Title, Text, Link } = Typography
const { TextArea } = Input

const Contact = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const res = await post('/feedback', {
        type: values.type,
        title: values.title,
        description: values.description,
      })

      if (res?.success) {
        message.success('Đã gửi feedback. Cảm ơn bạn!')
        form.resetFields()
      } else {
        message.error(res?.error?.message || 'Gửi feedback thất bại')
      }
    } catch (e) {
      // validate error or request error
      if (e?.errorFields) return
      const rawMsg = e?.response?.data?.error?.message || e?.response?.data?.error || e?.message
      const msg = rawMsg === 'Missing bearer token' ? 'Vui lòng đăng nhập' : rawMsg
      message.error(msg || 'Gửi feedback thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Title level={3} style={{ marginTop: 0 }}>
            Liên hệ
          </Title>
          <Text>
            Bạn có thể liên hệ qua Telegram:{' '}
            <Link href="https://t.me/vuhainam6423" target="_blank">
              https://t.me/vuhainam6423
            </Link>{' '}
            (Nam bán cam)
          </Text>
        </Card>

        <Card>
          <Title level={4} style={{ marginTop: 0 }}>
            Feedback / Báo lỗi / Đề xuất tính năng
          </Title>
          <Text type="secondary">
            Hãy mô tả rõ lỗi gặp phải hoặc chức năng bạn muốn thêm. Feedback sẽ được lưu lại để admin xem trong dashboard.
          </Text>

          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
            initialValues={{ type: 'bug' }}
          >
            <Form.Item
              label="Loại"
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn loại feedback' }]}
            >
              <Select
                options={[
                  { value: 'bug', label: 'Báo lỗi (Bug)' },
                  { value: 'feature', label: 'Đề xuất tính năng (Feature)' },
                  { value: 'other', label: 'Khác' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
            >
              <Input placeholder="Ví dụ: Lỗi không import được cookie" maxLength={200} />
            </Form.Item>

            <Form.Item
              label="Nội dung"
              name="description"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
            >
              <TextArea rows={6} placeholder="Mô tả chi tiết..." />
            </Form.Item>

            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleSubmit}
            >
              Gửi
            </Button>
          </Form>
        </Card>
      </Space>
    </div>
  )
}

export default Contact

