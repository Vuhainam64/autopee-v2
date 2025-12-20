import { Modal, Form, Input, Select, Space, Tag } from 'antd'

const { Option } = Select
const { TextArea } = Input

export default function ApiModal({
  visible,
  editingApi,
  roles,
  onCancel,
  onSubmit,
  form,
}) {
  return (
    <Modal
      title={editingApi ? 'Sửa API' : 'Thêm API'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="endpoint"
          label="Endpoint"
          rules={[{ required: true, message: 'Vui lòng nhập endpoint' }]}
        >
          <Input placeholder="/api/user/me" />
        </Form.Item>
        <Form.Item name="method" label="Method" initialValue="GET">
          <Select>
            <Option value="GET">GET</Option>
            <Option value="POST">POST</Option>
            <Option value="PUT">PUT</Option>
            <Option value="DELETE">DELETE</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="allowedRoles"
          label="Quyền truy cập"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một quyền' }]}
        >
          <Select mode="multiple" placeholder="Chọn quyền">
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
        <Form.Item
          name="description"
          label="Mô tả"
        >
          <TextArea rows={3} placeholder="Mô tả về API này" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

