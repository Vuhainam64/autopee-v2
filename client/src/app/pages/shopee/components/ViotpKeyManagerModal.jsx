import { useEffect, useMemo, useState } from 'react'
import { App, Button, Modal, Space, Table, Typography, Popconfirm, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { del, get } from '../../../services/api.js'
import ViotpKeyUpsertModal from './ViotpKeyUpsertModal.jsx'

const { Text } = Typography

export default function ViotpKeyManagerModal({ open, onClose, onChanged }) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [upsertOpen, setUpsertOpen] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await get('/viotp/keys')
      if (res?.success) {
        setItems(res.data.items || [])
      } else {
        message.error(res?.error?.message || 'Không thể tải danh sách key')
      }
    } catch (e) {
      message.error(e?.message || 'Không thể tải danh sách key')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleDelete = async (id) => {
    try {
      setLoading(true)
      const res = await del(`/viotp/keys/${id}`)
      if (res?.success) {
        message.success('Đã xoá key')
        await load()
        onChanged?.()
      } else {
        message.error(res?.error?.message || 'Xoá key thất bại')
      }
    } catch (e) {
      message.error(e?.message || 'Xoá key thất bại')
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        title: 'Tên',
        dataIndex: 'name',
        key: 'name',
        render: (v) => <Text strong>{v}</Text>,
      },
      {
        title: 'Token',
        dataIndex: 'token',
        key: 'token',
        ellipsis: true,
        render: (v) => (
          <Text code copyable={{ text: v }}>
            {v}
          </Text>
        ),
      },
      {
        title: 'Cập nhật',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 160,
        render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
      },
      {
        title: 'Last used',
        dataIndex: 'lastUsedAt',
        key: 'lastUsedAt',
        width: 160,
        render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : <Tag>Chưa dùng</Tag>),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 120,
        render: (_, r) => (
          <Space>
            <Popconfirm title="Xoá key này?" onConfirm={() => handleDelete(r._id)}>
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading],
  )

  return (
    <>
      <Modal
        title="Quản lý VIOTP Key"
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        destroyOnClose
      >
        <div className="flex items-center justify-between mb-3">
          <Text type="secondary">
            Lưu key theo tài khoản của bạn. Bạn có thể copy token (ẩn bớt) và xoá khi không dùng.
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUpsertOpen(true)}>
            Thêm key
          </Button>
        </div>

        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{ pageSize: 8 }}
        />
      </Modal>

      <ViotpKeyUpsertModal
        open={upsertOpen}
        onClose={() => setUpsertOpen(false)}
        onSaved={async () => {
          setUpsertOpen(false)
          await load()
          onChanged?.()
        }}
      />
    </>
  )
}

