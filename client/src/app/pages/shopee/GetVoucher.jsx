import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Button,
  Form,
  Input,
  Typography,
  Space,
  Card,
  Tag,
  Spin,
  Empty,
  Tabs,
  Badge,
  Tooltip,
  Divider,
  App,
  Descriptions,
} from 'antd'
import { FaGift, FaShippingFast } from 'react-icons/fa'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { post, get } from '../../services/api.js'

const { Text } = Typography

const GetVoucher = () => {
  const { message } = App.useApp()
  const [cookieValue, setCookieValue] = useState('')
  const [isSavingId, setIsSavingId] = useState('')
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [voucherList, setVoucherList] = useState([])
  const [freeshipList, setFreeshipList] = useState([])
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)

  // Parse cookies từ textarea, mỗi dòng là 1 cookie
  const cookies = useMemo(() => {
    if (!cookieValue) return []
    return cookieValue
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length >= 10)
  }, [cookieValue])

  const isCookieValid = useMemo(() => cookies.length > 0, [cookies])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Lấy voucher và freeship từ 2 API riêng biệt
      const [voucherResponse, freeshipResponse] = await Promise.all([
        get('/shopee/vouchers?limit=200'),
        get('/shopee/freeships?limit=200'),
      ])
      
      if (voucherResponse?.success && Array.isArray(voucherResponse.data)) {
        setVoucherList(voucherResponse.data)
      } else {
        setVoucherList([])
      }
      
      if (freeshipResponse?.success && Array.isArray(freeshipResponse.data)) {
        setFreeshipList(freeshipResponse.data)
      } else {
        setFreeshipList([])
      }
    } catch (e) {
      console.error('Error loading vouchers/freeships:', e)
      message.error('Không thể tải danh sách voucher/freeship')
      setVoucherList([])
      setFreeshipList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const saveSingle = async (item) => {
    if (!isCookieValid) {
      message.warning('Vui lòng dán ít nhất một cookie Shopee hợp lệ (mỗi dòng một cookie)')
      return
    }
    try {
      setIsSavingId(String(item.promotionId))
      
      // Thử từng cookie cho đến khi thành công
      let lastError = null
      for (const cookie of cookies) {
        try {
          const result = await post('/shopee/save-voucher', {
            cookie: cookie,
            voucher_promotionid: item.promotionId,
            signature: item.signature,
            voucher_code: item.voucherCode,
          })

          if (result?.success && result.data) {
            if (result.data.error === 0) {
              message.success(`Đã lưu: ${item.voucherCode}`)
              // Reload danh sách để cập nhật
              await loadData()
              return // Thành công, dừng lại
            } else if (result.data.error === 5) {
              message.info(`Voucher ${item.voucherCode} đã được lưu trước đó`)
              return // Đã lưu rồi, dừng lại
            } else {
              lastError = result.data.error_msg || 'Không thể lưu voucher với cookie này'
              // Tiếp tục thử cookie tiếp theo
            }
          } else {
            lastError = 'Không thể lưu voucher với cookie này'
            // Tiếp tục thử cookie tiếp theo
          }
        } catch (e) {
          lastError = 'Có lỗi xảy ra khi lưu voucher với cookie này'
          // Tiếp tục thử cookie tiếp theo
        }
      }
      
      // Nếu đã thử hết tất cả cookies mà không thành công
      if (lastError) {
        message.error(`Không thể lưu voucher với bất kỳ cookie nào: ${lastError}`)
      }
    } catch (e) {
      console.error('Error saving voucher:', e)
      message.error('Có lỗi xảy ra khi lưu voucher')
    } finally {
      setIsSavingId('')
    }
  }

  const saveAll = async () => {
    if (!isCookieValid) {
      message.warning('Vui lòng dán ít nhất một cookie Shopee hợp lệ (mỗi dòng một cookie)')
      return
    }
    const allItems = [...voucherList, ...freeshipList]
    if (allItems.length === 0) {
      message.info('Không có voucher để lưu')
      return
    }
    try {
      setIsSavingAll(true)
      let success = 0
      let alreadySaved = 0
      let errors = 0
      
      for (const item of allItems) {
        let itemSuccess = false
        
        // Thử từng cookie cho đến khi thành công
        for (const cookie of cookies) {
          try {
            const result = await post('/shopee/save-voucher', {
              cookie: cookie,
              voucher_promotionid: item.promotionId,
              signature: item.signature,
              voucher_code: item.voucherCode,
            })
            
            if (result?.success && result.data) {
              if (result.data.error === 0) {
                success += 1
                itemSuccess = true
                break // Thành công, chuyển sang voucher tiếp theo
              } else if (result.data.error === 5) {
                alreadySaved += 1
                itemSuccess = true
                break // Đã lưu rồi, chuyển sang voucher tiếp theo
              }
              // Nếu lỗi khác, tiếp tục thử cookie tiếp theo
            }
          } catch (e) {
            // Tiếp tục thử cookie tiếp theo
          }
        }
        
        if (!itemSuccess) {
          errors += 1
        }
      }
      
      let msg = `Lưu thành công ${success} voucher`
      if (alreadySaved > 0) {
        msg += `, ${alreadySaved} voucher đã được lưu trước đó`
      }
      if (errors > 0) {
        msg += `, ${errors} voucher lỗi`
      }
      message.success(msg)
      
      // Reload danh sách
      await loadData()
    } catch (e) {
      console.error('Error saving all vouchers:', e)
      message.error('Có lỗi xảy ra khi lưu tất cả voucher')
    } finally {
      setIsSavingAll(false)
    }
  }

  const showVoucherDetail = (item) => {
    setSelectedVoucher(item)
    setDetailModalVisible(true)
  }

  const renderList = (data, type = 'voucher') => {
    const tagColor = type === 'voucher' ? 'magenta' : 'geekblue'

    if (isLoading)
      return (
        <div className='w-full flex justify-center py-8'>
          <Spin size='large' />
        </div>
      )
    if (!data || data.length === 0)
      return (
        <div className='py-6'>
          <Empty description='Không có voucher' />
        </div>
      )

    return (
      <div className='space-y-4'>
        {data.map((item, index) => {
          // Shopee trả về giá trị dư 5 số 0, chia cho 100000
          const actualDiscountValue = item.discountValue > 0 ? Math.floor(item.discountValue / 100000) : 0
          const actualDiscountCap = item.discountCap > 0 ? Math.floor(item.discountCap / 100000) : 0
          const actualMinSpend = item.minSpend > 0 ? Math.floor(item.minSpend / 100000) : 0

          return (
            <Card
              key={`${item.promotionId}-${item.voucherCode}-${index}`}
              className={`rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${
                item.hasExpired ? 'bg-gray-100 opacity-60' : 'bg-white'
              }`}
              style={{ paddingLeft: '4px', paddingRight: '16px', marginBottom: '16px' }}
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 pl-1'>
                  <div className='flex items-center gap-2 flex-wrap mb-2'>
                    <Tag color={tagColor} className='font-mono'>
                      {item.voucherCode}
                    </Tag>
                    {item.hasExpired && <Tag color="red">Đã hết hạn</Tag>}
                    {item.disabled && <Tag color="default">Đã vô hiệu</Tag>}
                  </div>
                  <div className='mt-2 space-y-1'>
                    {actualDiscountValue > 0 && (
                      <div className='text-sm text-gray-700'>
                        Giảm: <strong className='text-orange-300'>{actualDiscountValue.toLocaleString('vi-VN')} VND</strong>
                        {actualMinSpend > 0 && <span className='text-gray-500'> (Đơn tối thiểu: {actualMinSpend.toLocaleString('vi-VN')} VND)</span>}
                      </div>
                    )}
                    {item.discountPercentage > 0 && (
                      <div className='text-sm text-gray-700'>
                        Giảm: <strong className='text-orange-300'>{item.discountPercentage}%</strong>
                        {actualDiscountCap > 0 && <span className='text-gray-500'> (Tối đa: {actualDiscountCap.toLocaleString('vi-VN')} VND)</span>}
                        {actualMinSpend > 0 && <span className='text-gray-500'> (Đơn tối thiểu: {actualMinSpend.toLocaleString('vi-VN')} VND)</span>}
                      </div>
                    )}
                    {item.endTime && (
                      <div className='text-xs text-gray-500'>
                        HSD: {dayjs.unix(item.endTime).format('DD/MM/YYYY HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex-shrink-0'>
                  <Space size="small">
                    <Tooltip title='Xem chi tiết'>
                      <Button
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => showVoucherDetail(item)}
                      >
                        Xem chi tiết
                      </Button>
                    </Tooltip>
                    <Tooltip title='Sao chép mã'>
                      <Button
                        size='small'
                        className='hover:!border-gray-300'
                        onClick={() => {
                          navigator.clipboard
                            .writeText(item.voucherCode)
                            .then(() => message.success('Đã sao chép mã'))
                        }}
                      >
                        Sao chép mã
                      </Button>
                    </Tooltip>
                    <Tooltip title={!isCookieValid ? 'Dán cookie trước khi lưu' : 'Lưu voucher này'}>
                      <Button
                        type='primary'
                        size='small'
                        className='bg-gradient-to-r from-blue-600 to-indigo-600 shadow hover:from-blue-700 hover:to-indigo-700'
                        loading={isSavingId === String(item.promotionId)}
                        onClick={() => saveSingle(item)}
                        disabled={!isCookieValid || isSavingAll}
                      >
                        Lưu
                      </Button>
                    </Tooltip>
                  </Space>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  const voucherTab = {
    key: 'voucher',
    label: (
      <div className='flex items-center gap-2'>
        <FaGift className='text-pink-500' />
        <span>Voucher mã giảm giá</span>
        <Badge count={voucherList.length} overflowCount={999} className='ml-1' />
      </div>
    ),
    children: <div className='pt-2'>{renderList(voucherList, 'voucher')}</div>,
  }

  const freeshipTab = {
    key: 'freeship',
    label: (
      <div className='flex items-center gap-2'>
        <FaShippingFast className='text-indigo-500' />
        <span>Voucher Freeship</span>
        <Badge count={freeshipList.length} overflowCount={999} className='ml-1' />
      </div>
    ),
    children: <div className='pt-2'>{renderList(freeshipList, 'freeship')}</div>,
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-slate-900 flex items-center gap-2'>
          <div className='p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100'>
            <FaGift className='text-yellow-600 text-xl' />
          </div>
          Lấy Voucher Shopee
        </h1>
      </div>
      <Space orientation='vertical' size='large' className='w-full'>
          <Card
            className='rounded-xl border-none shadow-sm bg-white/70 backdrop-blur'
            styles={{ body: { padding: 16 } }}
          >
            <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-3'>
              <div className='text-gray-700'>
                <Text>
                  Dán cookie Shopee của bạn, sau đó bấm Lưu tại từng voucher bạn muốn lưu vào tài
                  khoản.
                </Text>
              </div>
              <div className='flex gap-2'>
                <Button onClick={loadData} disabled={isLoading} className='hover:border-gray-300'>
                  Làm mới danh sách
                </Button>
                <Tooltip
                  title={
                    !isCookieValid ? 'Dán cookie trước khi lưu' : 'Lưu tất cả voucher hiển thị'
                  }
                >
                  <Button
                    type='default'
                    onClick={saveAll}
                    disabled={!isCookieValid || isSavingAll}
                    loading={isSavingAll}
                    className='border-blue-500 text-blue-600 hover:bg-blue-50'
                  >
                    Lưu tất cả
                  </Button>
                </Tooltip>
              </div>
            </div>

            <Divider className='my-3' />

            <Form layout='vertical' className='mb-0'>
              <Form.Item 
                label='Cookie Shopee' 
                required 
                className='mb-0'
                help={`Đã nhập ${cookies.length} cookie hợp lệ. Mỗi dòng là một cookie.`}
              >
                <Input.TextArea
                  rows={5}
                  value={cookieValue}
                  onChange={(e) => setCookieValue(e.target.value)}
                  placeholder='Dán cookie Shopee vào đây, mỗi dòng một cookie...&#10;Ví dụ:&#10;SPC_ST=.cookie1...&#10;SPC_ST=.cookie2...'
                  className='font-mono'
                />
              </Form.Item>
            </Form>
          </Card>

          <Card
            className='rounded-xl border-none shadow-md bg-white/80 backdrop-blur'
            styles={{ body: { padding: 16 } }}
          >
            <Tabs defaultActiveKey='voucher' items={[voucherTab, freeshipTab]} />
          </Card>
        </Space>

      {/* Modal chi tiết voucher */}
      <Modal
        title={
          <div className='flex items-center gap-2'>
            <FaGift className='text-yellow-600' />
            <span>Chi tiết Voucher</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedVoucher(null)
        }}
        footer={null}
        width={700}
      >
        {selectedVoucher && (
          <div className='mt-4'>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Mã voucher">
                <Text strong className='font-mono text-lg'>{selectedVoucher.voucherCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tên voucher">
                {selectedVoucher.voucherName || selectedVoucher.voucherCode}
              </Descriptions.Item>
              <Descriptions.Item label="Promotion ID">
                <Text className='font-mono'>{selectedVoucher.promotionId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Signature">
                <Text className='font-mono text-xs break-all'>{selectedVoucher.signature}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                <div className='whitespace-pre-wrap'>{selectedVoucher.description || '-'}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Giảm giá">
                {selectedVoucher.discountValue > 0 && (
                  <Text strong className='text-green-600'>
                    {Math.floor(selectedVoucher.discountValue / 100000).toLocaleString('vi-VN')} VND
                  </Text>
                )}
                {selectedVoucher.discountPercentage > 0 && (
                  <div>
                    <Text strong className='text-green-600'>{selectedVoucher.discountPercentage}%</Text>
                    {selectedVoucher.discountCap > 0 && (
                      <span className='text-gray-500 ml-2'>
                        (Tối đa: {Math.floor(selectedVoucher.discountCap / 100000).toLocaleString('vi-VN')} VND)
                      </span>
                    )}
                  </div>
                )}
                {selectedVoucher.discountValue === 0 && selectedVoucher.discountPercentage === 0 && '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn tối thiểu">
                {selectedVoucher.minSpend > 0 
                  ? `${Math.floor(selectedVoucher.minSpend / 100000).toLocaleString('vi-VN')} VND`
                  : '0 VND'}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn sử dụng">
                {selectedVoucher.endTime 
                  ? dayjs.unix(selectedVoucher.endTime).format('DD/MM/YYYY HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Space>
                  {selectedVoucher.hasExpired && <Tag color="red">Đã hết hạn</Tag>}
                  {selectedVoucher.disabled && <Tag color="default">Đã vô hiệu</Tag>}
                  {!selectedVoucher.hasExpired && !selectedVoucher.disabled && <Tag color="green">Hoạt động</Tag>}
                </Space>
              </Descriptions.Item>
              {selectedVoucher.newUserOnly && (
                <Descriptions.Item label="Điều kiện">
                  <Tag color="orange">Chỉ dành cho người dùng mới</Tag>
                </Descriptions.Item>
              )}
              {selectedVoucher.shopeeWalletOnly && (
                <Descriptions.Item label="Phương thức thanh toán">
                  <Tag color="blue">Chỉ áp dụng với ShopeePay</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default GetVoucher

