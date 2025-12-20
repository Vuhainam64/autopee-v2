import { Modal, Form, Input, Select, Space, Tag } from 'antd'

const { Option } = Select
const { TextArea } = Input

export default function RouteModal({
  visible,
  editingRoute,
  roles,
  onCancel,
  onSubmit,
  form,
}) {
  return (
    <Modal
      title={editingRoute ? 'Sửa Route' : 'Thêm Route'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="path"
          label="Path"
          rules={[{ required: true, message: 'Vui lòng nhập path' }]}
        >
          <Input placeholder="/dashboard/permissions" />
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
          <TextArea rows={3} placeholder="Mô tả về route này" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

