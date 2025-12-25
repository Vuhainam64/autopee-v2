import React from 'react'
import { Card, Typography, Space, Divider, Anchor } from 'antd'
import {
  SafetyCertificateOutlined,
  LockOutlined,
  FileTextOutlined,
  GlobalOutlined,
  DeleteOutlined,
  MailOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph, Link } = Typography

const Section = ({ id, title, icon, children }) => (
  <Card id={id} style={{ borderRadius: 16 }}>
    <Space align="center" size={10} style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 18, color: '#fa8c16' }}>{icon}</span>
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
    </Space>
    {children}
  </Card>
)

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div
        className="rounded-3xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,247,237,1) 0%, rgba(255,255,255,1) 60%, rgba(255,251,235,1) 100%)',
          border: '1px solid #ffe7ba',
        }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={2} style={{ margin: 0 }}>
            Chính sách bảo mật
          </Title>
          <Text type="secondary">
            Tài liệu này mô tả cách Autopee thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu của bạn khi sử dụng dịch vụ.
          </Text>
          <Text type="secondary">
            Cập nhật lần cuối: <Text strong>{new Date().toLocaleDateString('vi-VN')}</Text>
          </Text>
        </Space>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <Card style={{ borderRadius: 16, position: 'sticky', top: 92, height: 'fit-content' }}>
          <Title level={5} style={{ marginTop: 0 }}>
            Mục lục
          </Title>
          <Anchor
            affix={false}
            items={[
              { key: 'overview', href: '#overview', title: 'Tổng quan' },
              { key: 'data', href: '#data', title: 'Dữ liệu chúng tôi thu thập' },
              { key: 'use', href: '#use', title: 'Mục đích sử dụng' },
              { key: 'security', href: '#security', title: 'Bảo mật & lưu trữ' },
              { key: 'sharing', href: '#sharing', title: 'Chia sẻ dữ liệu' },
              { key: 'rights', href: '#rights', title: 'Quyền của người dùng' },
              { key: 'cookies', href: '#cookies', title: 'Cookie & tracking' },
              { key: 'contact', href: '#contact', title: 'Liên hệ' },
            ]}
          />
        </Card>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Section
            id="overview"
            title="Tổng quan"
            icon={<FileTextOutlined />}
          >
            <Paragraph style={{ marginBottom: 0 }}>
              Autopee cam kết tôn trọng quyền riêng tư và bảo vệ thông tin cá nhân của bạn. Chúng tôi chỉ thu thập dữ liệu ở mức cần thiết
              để vận hành dịch vụ (ví dụ: xác thực đăng nhập, lưu cấu hình, lịch sử giao dịch) và cải thiện trải nghiệm người dùng.
            </Paragraph>
          </Section>

          <Section
            id="data"
            title="Dữ liệu chúng tôi thu thập"
            icon={<SafetyCertificateOutlined />}
          >
            <Paragraph>
              Tùy theo tính năng bạn sử dụng, chúng tôi có thể thu thập một số loại dữ liệu sau:
            </Paragraph>
            <ul className="ml-5 list-disc space-y-2 text-slate-700">
              <li>
                <Text strong>Thông tin tài khoản:</Text> email, UID, tên hiển thị, ảnh đại diện (nếu có).
              </li>
              <li>
                <Text strong>Dữ liệu vận hành dịch vụ:</Text> cấu hình, lịch sử thao tác, logs kỹ thuật phục vụ chẩn đoán lỗi.
              </li>
              <li>
                <Text strong>Dữ liệu thanh toán/giao dịch:</Text> nội dung giao dịch, số tiền, trạng thái xử lý.
              </li>
              <li>
                <Text strong>Thông tin thiết bị:</Text> user-agent, địa chỉ IP (phục vụ bảo mật và chống gian lận).
              </li>
              <li>
                <Text strong>Nội dung bạn gửi:</Text> feedback, báo lỗi, đề xuất tính năng.
              </li>
            </ul>
            <Divider />
            <Text type="secondary">
              Lưu ý: Autopee không bán dữ liệu người dùng cho bên thứ ba.
            </Text>
          </Section>

          <Section
            id="use"
            title="Mục đích sử dụng dữ liệu"
            icon={<GlobalOutlined />}
          >
            <ul className="ml-5 list-disc space-y-2 text-slate-700">
              <li>Vận hành dịch vụ, cung cấp tính năng và hỗ trợ người dùng.</li>
              <li>Xác thực đăng nhập, kiểm soát truy cập và đảm bảo an toàn hệ thống.</li>
              <li>Phân tích lỗi, tối ưu hiệu năng, cải thiện trải nghiệm sản phẩm.</li>
              <li>Gửi thông báo quan trọng liên quan đến tài khoản hoặc thay đổi chính sách (nếu cần).</li>
            </ul>
          </Section>

          <Section
            id="security"
            title="Bảo mật & lưu trữ"
            icon={<LockOutlined />}
          >
            <Paragraph>
              Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ dữ liệu khỏi truy cập trái phép, thay đổi hoặc phá hủy.
            </Paragraph>
            <ul className="ml-5 list-disc space-y-2 text-slate-700">
              <li>Mã hóa trong quá trình truyền tải (HTTPS) nếu được cấu hình trên môi trường triển khai.</li>
              <li>Phân quyền truy cập theo vai trò (role-based access control).</li>
              <li>Ghi log và theo dõi bất thường để phát hiện sự cố bảo mật.</li>
              <li>Lưu trữ dữ liệu trong thời gian cần thiết để cung cấp dịch vụ hoặc theo yêu cầu pháp lý (nếu có).</li>
            </ul>
          </Section>

          <Section
            id="sharing"
            title="Chia sẻ dữ liệu"
            icon={<SafetyCertificateOutlined />}
          >
            <Paragraph>
              Autopee chỉ chia sẻ dữ liệu trong các trường hợp sau:
            </Paragraph>
            <ul className="ml-5 list-disc space-y-2 text-slate-700">
              <li>Khi có sự đồng ý của bạn.</li>
              <li>Khi cần thiết để tuân thủ yêu cầu pháp luật hoặc cơ quan có thẩm quyền.</li>
              <li>
                Với nhà cung cấp dịch vụ hạ tầng (ví dụ: dịch vụ xác thực) trong phạm vi cần thiết để vận hành hệ thống.
              </li>
            </ul>
          </Section>

          <Section
            id="rights"
            title="Quyền của người dùng"
            icon={<DeleteOutlined />}
          >
            <ul className="ml-5 list-disc space-y-2 text-slate-700">
              <li>Yêu cầu truy cập/xem dữ liệu cá nhân đang được lưu trữ.</li>
              <li>Yêu cầu chỉnh sửa dữ liệu không chính xác.</li>
              <li>Yêu cầu xóa dữ liệu (trong phạm vi pháp luật cho phép).</li>
              <li>Rút lại sự đồng ý (nếu việc xử lý dựa trên sự đồng ý).</li>
            </ul>
            <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
              Để thực hiện các quyền trên, vui lòng liên hệ chúng tôi theo mục <Link href="#contact">Liên hệ</Link>.
            </Paragraph>
          </Section>

          <Section
            id="cookies"
            title="Cookie & tracking"
            icon={<FileTextOutlined />}
          >
            <Paragraph style={{ marginBottom: 0 }}>
              Autopee có thể sử dụng cookie/localStorage để duy trì trạng thái đăng nhập, ghi nhớ cài đặt và cải thiện trải nghiệm.
              Chúng tôi không sử dụng cookie để bán quảng cáo bên thứ ba.
            </Paragraph>
          </Section>

          <Section
            id="contact"
            title="Liên hệ"
            icon={<MailOutlined />}
          >
            <Paragraph style={{ marginBottom: 0 }}>
              Nếu bạn có câu hỏi về chính sách bảo mật hoặc cần hỗ trợ liên quan đến dữ liệu, vui lòng liên hệ:
            </Paragraph>
            <ul className="ml-5 list-disc space-y-2 text-slate-700">
              <li>
                Telegram:{' '}
                <Link href="https://t.me/vuhainam6423" target="_blank">
                  https://t.me/vuhainam6423
                </Link>
              </li>
              <li>
                Trang liên hệ: <Link href="/contact">/contact</Link>
              </li>
            </ul>
          </Section>

          <Card style={{ borderRadius: 16, borderStyle: 'dashed' }}>
            <Text type="secondary">
              Chính sách này có thể được cập nhật theo thời gian để phản ánh thay đổi về sản phẩm hoặc yêu cầu pháp lý.
            </Text>
          </Card>
        </Space>
      </div>
    </div>
  )
}

