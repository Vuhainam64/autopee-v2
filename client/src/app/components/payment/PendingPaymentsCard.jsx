import { useState, useEffect, useRef } from 'react'
import { Card, Button, Tag } from 'antd'
import { WalletOutlined } from '@ant-design/icons'

const PendingPaymentsCard = ({ payments, onContinuePayment }) => {
  const [timeRemainingMap, setTimeRemainingMap] = useState({})

  // Cập nhật countdown cho mỗi payment (chỉ update UI, không gọi API)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newMap = {}

      payments.forEach((payment) => {
        if (payment.expiresAt) {
          const paymentId = payment._id || payment.id
          const expiresAt = new Date(payment.expiresAt)
          const now = new Date()
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
          const isExpired = expiresAt < now

          newMap[paymentId] = {
            seconds: remaining,
            isExpired,
          }
        }
      })
      setTimeRemainingMap(newMap)
    }, 1000) // Update mỗi giây

    return () => clearInterval(intervalId)
  }, [payments])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <WalletOutlined />
          <span>Đơn chờ thanh toán ({payments.length})</span>
        </div>
      }
    >
      <div className="space-y-3">
        {payments.map((payment) => {
          const timeInfo = timeRemainingMap[payment._id || payment.id]
          const isExpired = timeInfo?.isExpired || false
          const timeRemaining = timeInfo?.seconds || 0

          return (
            <div
              key={payment._id || payment.id}
              className="flex items-center justify-between p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition cursor-pointer"
              onClick={() => onContinuePayment(payment)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-orange-600">
                    {payment.amount.toLocaleString('vi-VN')} đ
                  </div>
                  <Tag color={isExpired ? 'red' : 'orange'}>
                    {isExpired ? 'Hết hạn' : 'Đang chờ'}
                  </Tag>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Mã: {payment.paymentCode}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Tạo lúc:{' '}
                  {payment.createdAt
                    ? new Date(payment.createdAt).toLocaleString('vi-VN')
                    : '-'}
                </div>
              </div>
              <div className="text-right">
                {!isExpired && timeRemaining > 0 && (
                  <div className="text-lg font-bold text-orange-600 mb-2">
                    {formatTime(timeRemaining)}
                  </div>
                )}
                {isExpired && (
                  <div className="text-sm text-red-500 mb-2">Đã hết hạn</div>
                )}
                <Button
                  type="link"
                  className="text-orange-600 hover:text-orange-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    onContinuePayment(payment)
                  }}
                >
                  Tiếp tục thanh toán →
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default PendingPaymentsCard

