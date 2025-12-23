import React from 'react'
import { Card, Typography } from 'antd'

const { Title } = Typography

const CocaCola = () => {
  return (
    <div className="p-6">
      <Card>
        <Title level={2}>Coca Cola</Title>
        <p>Trang dịch vụ Coca Cola đang được phát triển...</p>
      </Card>
    </div>
  )
}

export default CocaCola

