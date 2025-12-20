import { Card, Table, Tag } from 'antd'

export default function HistoryTable({ history, loading }) {
  const historyColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'route' ? 'blue' : 'green'}>
          {type === 'route' ? 'Route' : 'API'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => {
        const colors = { create: 'green', update: 'orange', delete: 'red' }
        const labels = { create: 'Tạo', update: 'Sửa', delete: 'Xóa' }
        return <Tag color={colors[action]}>{labels[action]}</Tag>
      },
    },
    {
      title: 'Path/Endpoint',
      dataIndex: 'newData',
      key: 'path',
      width: 200,
      ellipsis: true,
      render: (newData, record) => {
        if (record.action === 'delete' && record.oldData) {
          return record.oldData.path || record.oldData.endpoint || '-'
        }
        return newData?.path || newData?.endpoint || '-'
      },
    },
    {
      title: 'Method',
      dataIndex: 'newData',
      key: 'method',
      width: 100,
      render: (newData, record) => {
        const method = record.action === 'delete' 
          ? (record.oldData?.method || 'GET')
          : (newData?.method || 'GET')
        const methodColors = {
          GET: 'blue',
          POST: 'green',
          PUT: 'orange',
          DELETE: 'red',
          PATCH: 'purple',
        }
        const methodColor = methodColors[method] || 'default'
        return <Tag color={methodColor}>{method}</Tag>
      },
    },
    {
      title: 'Người thay đổi',
      dataIndex: 'changedByName',
      key: 'changedByName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ]

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 20, responsive: true }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </div>
    </Card>
  )
}

