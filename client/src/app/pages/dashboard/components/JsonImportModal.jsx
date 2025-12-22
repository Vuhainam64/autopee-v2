import React from 'react'
import { Modal, Input, Button, Typography, Space } from 'antd'
import { GiftOutlined } from '@ant-design/icons'
import { FaShippingFast } from 'react-icons/fa'

const { Text } = Typography

const JsonImportModal = ({
  visible,
  type, // 'voucher' or 'freeship'
  jsonValue,
  loading,
  onChange,
  onCancel,
  onSubmit,
}) => {
  const icon = type === 'freeship' ? (
    <FaShippingFast className="text-blue-500" />
  ) : (
    <GiftOutlined className="text-orange-500" />
  )

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {icon}
          <span>Thêm {type === 'freeship' ? 'freeship' : 'voucher'} từ JSON</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <div className="mt-4">
        <Text type="secondary" className="block mb-2">
          Dán JSON response từ Shopee API vào đây:
        </Text>
        <Input.TextArea
          rows={15}
          value={jsonValue}
          onChange={onChange}
          placeholder='Dán JSON vào đây...'
          className="font-mono text-xs"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={onSubmit}
          >
            Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default JsonImportModal

