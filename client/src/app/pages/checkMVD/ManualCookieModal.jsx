import { Modal, Button, Input } from 'antd'

function ManualCookieModal({
  open,
  onCancel,
  onSubmit,
  loading,
  manualCookies,
  setManualCookies,
}) {
  return (
    <Modal
      title="Nhập Cookie Thủ Công"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={onSubmit} loading={loading}>
          Xác nhận
        </Button>,
      ]}
      width={600}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Nhập các Cookie vào đây, mỗi Cookie một dòng</p>
        <Input.TextArea
          rows={8}
          value={manualCookies}
          onChange={(e) => setManualCookies(e.target.value)}
          placeholder="Nhập các Cookie vào đây, mỗi Cookie một dòng"
          className="w-full"
        />
      </div>
    </Modal>
  )
}

export default ManualCookieModal


