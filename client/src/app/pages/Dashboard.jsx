import { Card, Row, Col, Statistic } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Tổng quan</h1>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng người dùng"
                value={1128}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={93}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Doanh thu"
                value={112893}
                prefix={<DollarOutlined />}
                suffix="VNĐ"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đơn thành công"
                value={89}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Hoạt động gần đây" className="h-full">
              <p className="text-slate-600">
                Danh sách hoạt động gần đây sẽ được hiển thị tại đây.
              </p>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Thống kê" className="h-full">
              <p className="text-slate-600">
                Biểu đồ và thống kê chi tiết sẽ được hiển thị tại đây.
              </p>
            </Card>
          </Col>
        </Row>
    </div>
  )
}

export default Dashboard

