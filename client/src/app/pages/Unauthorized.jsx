import { Result, Button } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { LockOutlined } from '@ant-design/icons'

function Unauthorized() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        icon={<LockOutlined style={{ color: '#faad14' }} />}
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        extra={
          <div className="flex items-center gap-3 justify-center">
            <Button type="primary" onClick={() => navigate(from)}>
              Quay lại
            </Button>
            <Button onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          </div>
        }
      />
    </div>
  )
}

export default Unauthorized

