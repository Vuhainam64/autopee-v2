import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Typography, Spin, App } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { get } from '../services/api.js'
import dayjs from 'dayjs'

const { Text } = Typography

function Dashboard() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    successfulTransactions: 0,
    totalServicesUsed: 0,
  })
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setActivitiesLoading(true)
      const [statsResponse, activitiesResponse] = await Promise.all([
        get('/admin/dashboard/stats'),
        get('/admin/dashboard/activities?limit=20'),
      ])

      if (statsResponse?.success) {
        setStats(statsResponse.data)
      }

      if (activitiesResponse?.success) {
        setActivities(activitiesResponse.data.activities)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      message.error('Không thể tải dữ liệu tổng quan')
    } finally {
      setLoading(false)
      setActivitiesLoading(false)
    }
  }

  const activityColumns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = {
          transaction: { color: 'blue', label: 'Giao dịch' },
          usage: { color: 'orange', label: 'Sử dụng' },
        }
        const info = typeMap[type] || { color: 'default', label: type }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Mô tả',
      key: 'description',
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.title}</div>
          {record.description && (
            <Text type="secondary" className="text-xs">{record.description}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (amount) => {
        const isPositive = amount > 0
        return (
          <Text strong style={{ color: isPositive ? '#3f8600' : '#cf1322' }}>
            {isPositive ? '+' : ''}
            {amount.toLocaleString('vi-VN')} VND
          </Text>
        )
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Tổng quan</h1>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng người dùng"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                styles={{ content: { color: '#3f8600' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={stats.totalTransactions}
                prefix={<ShoppingOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Doanh thu"
                value={stats.totalRevenue}
                precision={0}
                prefix={<DollarOutlined />}
                suffix="VNĐ"
                styles={{ content: { color: '#cf1322' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đơn thành công"
                value={stats.successfulTransactions}
                prefix={<CheckCircleOutlined />}
                styles={{ content: { color: '#722ed1' } }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card title="Lịch sử hoạt động gần đây" className="h-full">
            <Spin spinning={activitiesLoading}>
              <Table
                columns={activityColumns}
                dataSource={activities}
                rowKey={(record) => `${record.type}-${record.id}`}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                }}
                locale={{
                  emptyText: 'Chưa có hoạt động nào',
                }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

