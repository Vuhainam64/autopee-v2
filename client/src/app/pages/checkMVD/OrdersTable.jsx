import { Table, Button, Spin } from 'antd'

const downloadCookie = (cookie) => {
  const fileName = `cookie_${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}.txt`
  const blob = new Blob([cookie], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function OrdersTable({ data, loading, detailLoading, onViewDetail, onRemoveCookie }) {
  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Mã vận đơn',
      dataIndex: 'tracking_number',
      key: 'tracking_number',
      render: (text, record) => (record.noOrder ? 'Cookie hết hạn' : text),
    },
    {
      title: 'Mô tả theo dõi',
      dataIndex: 'tracking_info_description',
      key: 'tracking_info_description',
      render: (text, record) => (record.noOrder ? 'N/A' : text),
    },
    {
      title: 'Tên',
      dataIndex: ['address', 'shipping_name'],
      key: 'shipping_name',
      render: (text, record) => (record.noOrder ? 'N/A' : text),
    },
    {
      title: 'Hình',
      key: 'image',
      render: (_, record) => {
        if (record.noOrder) return 'N/A'
        if (record.product_info && record.product_info.length > 0 && record.product_info[0].image) {
          return (
            <img
              src={`https://cf.shopee.vn/file/${record.product_info[0].image}`}
              alt="Hình ảnh"
              className="w-20 h-20 object-cover rounded"
            />
          )
        }
        return 'N/A'
      },
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => {
        if (record.noOrder) return 'N/A'
        if (record.product_info && record.product_info.length > 0) {
          return record.product_info[0].name || 'N/A'
        }
        return 'N/A'
      },
    },
    {
      title: 'Chức năng',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => downloadCookie(record.cookie)}>
            Tải cookie
          </Button>
          {(record.checkout_id || record.order_id) && (
            <Button
              size="small"
              type="primary"
              loading={detailLoading}
              onClick={() => onViewDetail(record)}
            >
              Xem chi tiết
            </Button>
          )}
          <Button size="small" danger onClick={() => onRemoveCookie(record.cookie)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record, index) => record.order_id || `order-${index}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đơn hàng`,
        }}
        bordered
        size="middle"
        scroll={{ x: 1200, y: 'calc(100vh - 300px)' }}
        locale={{ emptyText: 'Chưa có đơn hàng nào. Vui lòng nhập cookie để xem danh sách đơn hàng.' }}
      />
    </Spin>
  )
}

export default OrdersTable


