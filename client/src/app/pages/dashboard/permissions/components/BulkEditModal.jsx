import { Modal, Form, Select, Space, Tag } from 'antd'

const { Option } = Select

export default function BulkEditModal({
  visible,
  type,
  count,
  roles,
  onCancel,
  onSubmit,
  form,
}) {
  return (
    <Modal
      title={`Sửa hàng loạt ${type === 'routes' ? 'Routes' : 'APIs'} (${count} items)`}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="allowedRoles"
          label="Quyền truy cập"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một quyền' }]}
          tooltip="Quyền này sẽ được áp dụng cho tất cả items đã chọn"
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
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <strong>Lưu ý:</strong> Thao tác này sẽ cập nhật quyền truy cập cho{' '}
          <strong>{count}</strong> {type === 'routes' ? 'routes' : 'APIs'} đã chọn.
        </div>
      </Form>
    </Modal>
  )
}

