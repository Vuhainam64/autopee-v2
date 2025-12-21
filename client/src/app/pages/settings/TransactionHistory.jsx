import { useState, useEffect } from 'react'
import { Card, Table, Input, Button, Space, Typography } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { get } from '../../services/api.js'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

const { Text } = Typography

function TransactionHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [pagination.page, pagination.limit])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await get(
        `/user/usage-history?page=${pagination.page}&limit=${pagination.limit}`
      )
      if (response?.success && response?.data) {
        setHistory(response.data.history || [])
        setPagination(response.data.pagination || pagination)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    // Chuẩn bị dữ liệu cho Excel
    const excelData = history.map((item, index) => ({
      '#': index + 1,
      'DỊCH VỤ': item.service,
      'SỐ TIỀN': item.amount,
      'THỜI GIAN': dayjs(item.createdAt).format('DD/MM/YYYY HH:mm:ss'),
      'MÃ GIAO DỊCH': item.transactionId || '0',
      'SỐ DƯ SAU BIẾN ĐỔNG': item.balanceAfter,
    }))

    // Tạo workbook và worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử giao dịch')

    // Xuất file
    const fileName = `Lich_su_giao_dich_${dayjs().format('YYYY-MM-DD')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const filteredHistory = history.filter((item) => {
    if (!searchText) return true
    const searchLower = searchText.toLowerCase()
    return (
      item.service?.toLowerCase().includes(searchLower) ||
      item.transactionId?.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => {
        const currentPage = pagination.page || 1
        const pageSize = pagination.limit || 50
        return (currentPage - 1) * pageSize + index + 1
      },
    },
    {
      title: 'DỊCH VỤ',
      dataIndex: 'service',
      key: 'service',
      sorter: (a, b) => a.service.localeCompare(b.service),
    },
    {
      title: 'SỐ TIỀN',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount) => (
        <span className="text-red-600 font-semibold">
          {amount.toLocaleString('vi-VN')} đ
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'THỜI GIAN',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'MÃ GIAO DỊCH',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      render: (id) => id || '0',
    },
    {
      title: 'SỐ DƯ SAU BIẾN ĐỔNG',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 180,
      render: (balance) => (
        <span className="font-semibold">
          {balance.toLocaleString('vi-VN')} đ
        </span>
      ),
      sorter: (a, b) => a.balanceAfter - b.balanceAfter,
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Lịch sử tài khoản 7 ngày gần nhất
            </h1>
            <p className="text-slate-600 mt-1">
              Xem lịch sử sử dụng tiền trong 7 ngày qua
            </p>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
          >
            Tải Excel
          </Button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Text>Show</Text>
            <Input
              type="number"
              min={10}
              max={100}
              value={pagination.limit}
              onChange={(e) => {
                setPagination((prev) => ({
                  ...prev,
                  limit: parseInt(e.target.value) || 50,
                  page: 1,
                }))
              }}
              style={{ width: 80 }}
            />
            <Text>entries</Text>
          </div>
          <Input
            placeholder="Search:"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredHistory}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                page,
                limit: pageSize,
              }))
            },
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default TransactionHistory

