import React from 'react'
import { Modal, Form, Input, InputNumber, Space, Button } from 'antd'
import { GiftOutlined } from '@ant-design/icons'

const VoucherForm = ({
  visible,
  editingVoucher,
  loading,
  form,
  onCancel,
  onSubmit,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <GiftOutlined className="text-orange-500" />
          <span>{editingVoucher ? 'Sửa voucher' : 'Thêm voucher mới'}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        className="mt-4"
      >
        <Form.Item
          name="promotionId"
          label="Promotion ID"
          rules={[{ required: true, message: 'Vui lòng nhập Promotion ID' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Nhập Promotion ID"
          />
        </Form.Item>

        <Form.Item
          name="voucherCode"
          label="Mã voucher"
          rules={[{ required: true, message: 'Vui lòng nhập mã voucher' }]}
        >
          <Input placeholder="Nhập mã voucher" className="font-mono" />
        </Form.Item>

        <Form.Item
          name="signature"
          label="Signature"
          rules={[{ required: true, message: 'Vui lòng nhập signature' }]}
        >
          <Input.TextArea
            rows={2}
            placeholder="Nhập signature"
            className="font-mono"
          />
        </Form.Item>

        <Form.Item name="voucherName" label="Tên voucher">
          <Input placeholder="Nhập tên voucher" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Nhập mô tả" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="discountValue" label="Giá trị giảm (VND)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
            />
          </Form.Item>

          <Form.Item name="discountPercentage" label="Phần trăm giảm (%)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
              max={100}
            />
          </Form.Item>

          <Form.Item name="discountCap" label="Giới hạn giảm tối đa (VND)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
            />
          </Form.Item>

          <Form.Item name="minSpend" label="Đơn tối thiểu (VND)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
            />
          </Form.Item>
        </div>

        <Form.Item name="endTime" label="Hạn sử dụng">
          <Input
            type="datetime-local"
            placeholder="Chọn ngày hết hạn"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingVoucher ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button onClick={onCancel}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default VoucherForm

