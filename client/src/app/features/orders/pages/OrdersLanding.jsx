import { Button, Card, Tag } from 'antd'
import {
  BarChartOutlined,
  CloudSyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'

const highlights = [
  {
    icon: <CloudSyncOutlined className="text-xl text-orange-500" />,
    title: 'Đồng bộ Shopee',
    description: 'Đơn hàng, tồn kho, mã vận đơn cập nhật theo thời gian thực.',
  },
  {
    icon: <ThunderboltOutlined className="text-xl text-orange-500" />,
    title: 'Tự động hóa vận hành',
    description: 'Tách gói, gộp đơn, in nhãn, phân tuyến kho chỉ với vài click.',
  },
  {
    icon: <BarChartOutlined className="text-xl text-orange-500" />,
    title: 'Báo cáo chi tiết',
    description: 'Hiệu suất shop, SLA giao hàng, cảnh báo rủi ro được tổng hợp.',
  },
]

function OrdersLanding() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20" id="features">
      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <div className="flex flex-wrap items-center gap-3">
            <Tag color="orange">Giải pháp đơn hàng Shopee</Tag>
            <span className="text-sm text-slate-500">
              Tối ưu vận hành & trải nghiệm khách hàng
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
            Chuẩn hóa quy trình, tăng tốc giao hàng, giảm lỗi.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Autopee kết nối Shopee và hệ thống nội bộ, tự động hoá toàn bộ vòng
            đời đơn hàng: từ tiếp nhận, phân bổ, đóng gói tới giao nhận và hậu
            mãi. Thiết kế cho đội vận hành, quản lý và phân tích tăng trưởng.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="primary"
              size="large"
              className="bg-orange-500 hover:bg-orange-600"
            >
              Dùng thử miễn phí
            </Button>
            <Button size="large">Xem demo nhanh</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <Card
                key={item.title}
                variant="outlined"
                className="h-full shadow-sm ring-1 ring-orange-50"
              >
                <div className="flex flex-col gap-2">
                  {item.icon}
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="rounded-3xl bg-orange-500 p-6 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-orange-100">
              Hiệu suất
            </p>
            <h3 className="mt-2 text-2xl font-semibold">
              SLA giao hàng dưới 24h
            </h3>
            <p className="mt-3 text-sm text-orange-50">
              Tự động cảnh báo khi đơn có nguy cơ trễ, ưu tiên tuyến giao phù
              hợp và đồng bộ trạng thái về Shopee ngay lập tức.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm font-semibold">
              <div>
                <p className="text-orange-100">Tăng tốc xử lý</p>
                <p className="text-2xl">+32%</p>
              </div>
              <div>
                <p className="text-orange-100">Giảm lỗi vận hành</p>
                <p className="text-2xl">-41%</p>
              </div>
            </div>
            <div className="mt-8 rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-orange-100">
                Đội ngũ hỗ trợ
              </p>
              <p className="mt-2 text-sm">
                Luôn kề vai sát cánh khi bạn scale-up chiến dịch, flash sale hay
                mở rộng kho mới.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OrdersLanding

