import { Modal, Form, Input, message, Space, Tag, Typography } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Text } = Typography

export default function ImportJsonModal({
  visible,
  type, // 'routes' or 'apis'
  onCancel,
  onSubmit,
  form,
}) {
  const handleSubmit = async (values) => {
    try {
      const jsonData = JSON.parse(values.json)
      
      // Validate structure
      if (!Array.isArray(jsonData)) {
        message.error('JSON phải là một mảng (array)')
        return
      }

      // Validate each item
      const errors = []
      jsonData.forEach((item, index) => {
        if (type === 'routes') {
          if (!item.path) errors.push(`Item ${index + 1}: thiếu field "path"`)
          if (!item.method) errors.push(`Item ${index + 1}: thiếu field "method"`)
          if (!item.allowedRoles || !Array.isArray(item.allowedRoles)) {
            errors.push(`Item ${index + 1}: thiếu field "allowedRoles" (phải là array)`)
          }
        } else {
          if (!item.endpoint) errors.push(`Item ${index + 1}: thiếu field "endpoint"`)
          if (!item.method) errors.push(`Item ${index + 1}: thiếu field "method"`)
          if (!item.allowedRoles || !Array.isArray(item.allowedRoles)) {
            errors.push(`Item ${index + 1}: thiếu field "allowedRoles" (phải là array)`)
          }
        }
      })

      if (errors.length > 0) {
        message.error(`Lỗi validation:\n${errors.join('\n')}`)
        return
      }

      await onSubmit(jsonData)
    } catch (error) {
      if (error instanceof SyntaxError) {
        message.error('JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.')
      } else {
        message.error(error.message || 'Có lỗi xảy ra')
      }
    }
  }

  const exampleJson = type === 'routes' 
    ? `[
  {
    "path": "/example",
    "method": "GET",
    "allowedRoles": ["user", "admin"],
    "description": "Example route"
  },
  {
    "path": "/example/create",
    "method": "POST",
    "allowedRoles": ["admin"],
    "description": "Create example"
  }
]`
    : `[
  {
    "endpoint": "/api/example",
    "method": "GET",
    "allowedRoles": ["user", "admin"],
    "description": "Example API"
  },
  {
    "endpoint": "/api/example/create",
    "method": "POST",
    "allowedRoles": ["admin"],
    "description": "Create example API"
  }
]`

  return (
    <Modal
      title={`Import ${type === 'routes' ? 'Routes' : 'APIs'} từ JSON`}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={700}
      okText="Import"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <Space>
            <InfoCircleOutlined className="text-blue-600" />
            <Text className="text-sm text-blue-700">
              Nhập JSON array chứa các {type === 'routes' ? 'routes' : 'APIs'} cần thêm.
              Các items đã tồn tại sẽ được bỏ qua.
            </Text>
          </Space>
        </div>

        <Form.Item
          name="json"
          label="JSON Data"
          rules={[{ required: true, message: 'Vui lòng nhập JSON' }]}
        >
          <TextArea
            rows={12}
            placeholder={exampleJson}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
        </Form.Item>

        <div className="rounded-lg bg-slate-50 p-3">
          <Text strong className="text-xs text-slate-600">Ví dụ format:</Text>
          <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs">
            {exampleJson}
          </pre>
        </div>
      </Form>
    </Modal>
  )
}

