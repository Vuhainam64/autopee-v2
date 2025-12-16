import { Button, Image, Typography } from 'antd'

const { Text } = Typography

function QrSection({ qrImage, qrLoading, onGen, polling }) {
  const { isRunning, seconds } = polling || {}
  const countdown =
    isRunning && seconds !== undefined
      ? ` (còn ${Math.max(0, seconds)}s)`
      : ''
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button onClick={onGen} loading={qrLoading}>
          Tạo mã QR
        </Button>
        <Text type="secondary">
          Tự kiểm tra mỗi 5s, hết hạn sau 60s{countdown} sẽ yêu cầu tạo lại.
        </Text>
      </div>
      {qrImage ? (
        <div className="flex flex-col items-center gap-2">
          <Image
            width={200}
            src={`data:image/png;base64,${qrImage}`}
            alt="Shopee QR"
            preview
          />
          <Text type="secondary" className="text-center">
            Mở app Shopee, quét mã; hệ thống tự kiểm tra 5s/lần, hết hạn sau 60s.
          </Text>
        </div>
      ) : (
        <Text type="secondary">Nhấn "Tạo mã QR" để bắt đầu.</Text>
      )}
    </div>
  )
}

export default QrSection

