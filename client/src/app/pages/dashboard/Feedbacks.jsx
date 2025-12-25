import React, { useEffect, useState } from 'react'
import { Card, Table, Space, Typography, Tag, Select, Input, Button, App } from 'antd'
import dayjs from 'dayjs'
import { get, put } from '../../services/api.js'

const { Title, Text } = Typography

const typeColor = {
  bug: 'red',
  feature: 'blue',
  other: 'default',
}

const statusColor = {
  pending: 'gold',
  in_progress: 'processing',
  resolved: 'green',
  rejected: 'default',
}

const Feedbacks = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })

  const [filterType, setFilterType] = useState()
  const [filterStatus, setFilterStatus] = useState()
  const [search, setSearch] = useState('')

  const load = async (page = 1) => {
    try {
      setLoading(true)
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(pagination.pageSize),
        ...(filterType ? { type: filterType } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(search ? { search } : {}),
      }).toString()

      const res = await get(`/admin/feedback?${qs}`)
      if (res?.success) {
        setItems(res.data.items || [])
        setPagination((p) => ({
          ...p,
          current: page,
          total: res.data.pagination?.total || 0,
        }))
      } else {
        message.error(res?.error?.message || 'Không thể tải feedback')
      }
    } catch (e) {
      message.error('Không thể tải feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus])

  const updateStatus = async (id, status) => {
    try {
      const res = await put(`/admin/feedback/${id}/status`, { status })
      if (res?.success) {
        message.success('Đã cập nhật trạng thái')
        await load(pagination.current)
      } else {
        message.error(res?.error?.message || 'Cập nhật thất bại')
      }
    } catch (e) {
      message.error('Cập nhật thất bại')
    }
  }

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200,
      render: (v) => <Text>{v || '-'}</Text>,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v) => <Tag color={typeColor[v] || 'default'}>{v || '-'}</Tag>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      ellipsis: true,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Nội dung',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (v, record) => (
        <Select
          value={v}
          style={{ width: '100%' }}
          onChange={(next) => updateStatus(record._id, next)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          optionRender={(opt) => (
            <Tag color={statusColor[opt.value] || 'default'} style={{ margin: 0 }}>
              {opt.label}
            </Tag>
          )}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <Title level={4} style={{ margin: 0 }}>
            Feedback người dùng
          </Title>
          <Space wrap>
            <Select
              allowClear
              placeholder="Lọc loại"
              value={filterType}
              style={{ width: 160 }}
              onChange={setFilterType}
              options={[
                { value: 'bug', label: 'Bug' },
                { value: 'feature', label: 'Feature' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Select
              allowClear
              placeholder="Lọc trạng thái"
              value={filterStatus}
              style={{ width: 180 }}
              onChange={setFilterStatus}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            <Input.Search
              placeholder="Tìm (title/description/email)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => load(1)}
              allowClear
              style={{ width: 260 }}
            />
            <Button onClick={() => load(pagination.current)} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (t) => `Tổng ${t} feedback`,
          }}
          onChange={(p) => load(p.current)}
        />
      </Card>
    </div>
  )
}

export default Feedbacks

