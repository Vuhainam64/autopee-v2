import React from 'react'
import { Table, Tag, Space, Button, Typography, Empty, Spin, Switch, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const FreeshipTable = ({ 
  loading, 
  freeships, 
  onEdit, 
  onDelete,
  onToggleHidden,
  onToggleExpired,
}) => {
  const columns = [
    {
      title: 'Mã freeship',
      dataIndex: 'voucherCode',
      key: 'voucherCode',
      width: 150,
      render: (text) => <Text strong className="font-mono">{text}</Text>,
    },
    {
      title: 'Tên freeship',
      dataIndex: 'voucherName',
      key: 'voucherName',
      width: 200,
    },
    {
      title: 'Giảm giá',
      key: 'discount',
      width: 150,
      render: (_, record) => {
        if (record.discountValue > 0) {
          const actualValue = Math.floor(record.discountValue / 100000)
          return (
            <Text strong style={{ color: '#3f8600' }}>
              {actualValue.toLocaleString('vi-VN')} VND
            </Text>
          )
        }
        if (record.discountPercentage > 0) {
          const actualCap = record.discountCap > 0 ? Math.floor(record.discountCap / 100000) : 0
          return (
            <Text strong style={{ color: '#3f8600' }}>
              {record.discountPercentage}%
              {actualCap > 0 && ` (Tối đa: ${actualCap.toLocaleString('vi-VN')} VND)`}
            </Text>
          )
        }
        return <Text type="secondary">-</Text>
      },
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minSpend',
      key: 'minSpend',
      width: 120,
      render: (value) => {
        if (value > 0) {
          const actualValue = Math.floor(value / 100000)
          return `${actualValue.toLocaleString('vi-VN')} VND`
        }
        return '-'
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.hasExpired && <Tag color="red">Hết hạn</Tag>}
          {record.disabled && <Tag color="default">Vô hiệu</Tag>}
          {!record.hasExpired && !record.disabled && <Tag color="green">Hoạt động</Tag>}
        </Space>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => {
        if (record.endTime) {
          const endDate = dayjs.unix(record.endTime)
          return (
            <Text type="secondary">
              HSD: {endDate.format('DD/MM/YYYY HH:mm')}
            </Text>
          )
        }
        return <Text type="secondary">-</Text>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space orientation="vertical" size="small">
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              size="small"
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              size="small"
            >
              Xóa
            </Button>
          </Space>
          <Space>
            <Tooltip title={record.hidden ? 'Hiện freeship' : 'Ẩn freeship'}>
              <span>Ẩn: </span>
              <Switch
                checked={record.hidden || false}
                onChange={(checked) => onToggleHidden(record, checked)}
                size="small"
              />
            </Tooltip>
            <Tooltip title={record.hasExpired ? 'Đánh dấu chưa hết hạn' : 'Đánh dấu hết hạn'}>
              <span>Hết hạn: </span>
              <Switch
                checked={record.hasExpired || false}
                onChange={(checked) => onToggleExpired(record, checked)}
                size="small"
              />
            </Tooltip>
          </Space>
        </Space>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <Table
        columns={columns}
        dataSource={freeships}
        rowKey={(record) => `${record.promotionId}-${record.voucherCode}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} freeship`,
        }}
        scroll={{ x: 1200 }}
        locale={{
          emptyText: <Empty description="Chưa có freeship nào" />,
        }}
      />
    </Spin>
  )
}

export default FreeshipTable

