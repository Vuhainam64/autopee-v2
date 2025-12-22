import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Button,
  Form,
  Input,
  Typography,
  Space,
  Card,
  List,
  Tag,
  Spin,
  Empty,
  Tabs,
  Badge,
  Tooltip,
  Divider,
} from 'antd'
import { FaGift, FaShippingFast } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { saveVoucherShopee, getVoucherShopee, getFreeshipShopee } from '../../../api/saveVoucher'

const { Text } = Typography

const GetVoucher = ({ visible, onClose }) => {
  const [cookieValue, setCookieValue] = useState('')
  const [isSavingId, setIsSavingId] = useState('')
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [voucherList, setVoucherList] = useState([])
  const [freeshipList, setFreeshipList] = useState([])

  const isCookieValid = useMemo(() => cookieValue && cookieValue.trim().length >= 10, [cookieValue])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [vouchers, freeships] = await Promise.all([getVoucherShopee(), getFreeshipShopee()])
      setVoucherList(Array.isArray(vouchers) ? vouchers : [])
      setFreeshipList(Array.isArray(freeships) ? freeships : [])
    } catch (e) {
      toast.error('Không thể tải danh sách voucher')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (visible) {
      loadData()
    }
  }, [visible])

  const saveSingle = async (item) => {
    if (!isCookieValid) {
      toast.warn('Vui lòng dán cookie Shopee hợp lệ')
      return
    }
    try {
      setIsSavingId(String(item.promotionId))
      const result = await saveVoucherShopee(
        cookieValue.trim(),
        item.promotionId,
        item.signature,
        item.voucherCode
      )
      if (result && result.error === 0) {
        toast.success(`Đã lưu: ${item.voucherCode}`)
      } else if (result && result.error === 5) {
        toast.info(`Voucher ${item.voucherCode} đã được lưu trước đó`)
      } else {
        const msg = result?.error_msg || 'Không thể lưu voucher. Vui lòng thử lại.'
        toast.error(msg)
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi lưu voucher')
    } finally {
      setIsSavingId('')
    }
  }

  const saveAll = async () => {
    if (!isCookieValid) {
      toast.warn('Vui lòng dán cookie Shopee hợp lệ')
      return
    }
    const allItems = [...voucherList, ...freeshipList]
    if (allItems.length === 0) {
      toast.info('Không có voucher để lưu')
      return
    }
    try {
      setIsSavingAll(true)
      let success = 0
      let alreadySaved = 0
      for (const item of allItems) {
        try {
          const result = await saveVoucherShopee(
            cookieValue.trim(),
            item.promotionId,
            item.signature,
            item.voucherCode
          )
          if (result && result.error === 0) {
            success += 1
          } else if (result && result.error === 5) {
            alreadySaved += 1
          }
        } catch (e) {
          // ignore per-item errors
        }
      }
      let message = `Lưu thành công ${success} voucher`
      if (alreadySaved > 0) {
        message += `, ${alreadySaved} voucher đã được lưu trước đó`
      }
      toast.success(message)
    } catch (e) {
      toast.error('Có lỗi xảy ra khi lưu tất cả voucher')
    } finally {
      setIsSavingAll(false)
    }
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
      <List
        itemLayout='horizontal'
        dataSource={data}
        className='grid gap-3'
        renderItem={(item) => (
          <List.Item
            className='bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4'
            actions={[
              <Tooltip title='Sao chép mã'>
                <Button
                  size='small'
                  className='hover:!border-gray-300'
                  onClick={() =>
                    navigator.clipboard
                      .writeText(item.voucherCode)
                      .then(() => toast.success('Đã sao chép mã'))
                  }
                >
                  Sao chép mã
                </Button>
              </Tooltip>,
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
              </Tooltip>,
            ]}
          >
            <List.Item.Meta
              title={
                <div className='flex items-center gap-2'>
                  <Text strong className='text-gray-800'>
                    {item.voucherName || 'Voucher'}
                  </Text>
                  <Tag color={tagColor} className='font-mono'>
                    {item.voucherCode}
                  </Tag>
                </div>
              }
              description={
                <div className='text-xs text-gray-500'>
                  promotionId: <span className='font-mono'>{item.promotionId}</span> | signature:{' '}
                  <span className='font-mono'>{item.signature?.slice(0, 12)}...</span>
                </div>
              }
            />
          </List.Item>
        )}
      />
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
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <div className='p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100'>
            <FaGift className='text-yellow-600 text-xl' />
          </div>
          <span className='text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
            Lấy Voucher Shopee
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={880}
      centered
      className='voucher-modal'
    >
      <div className='bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 rounded-2xl'>
        <Space direction='vertical' size='large' className='w-full'>
          <Card
            className='rounded-xl border-none shadow-sm bg-white/70 backdrop-blur'
            bodyStyle={{ padding: 16 }}
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
              <Form.Item label='Cookie Shopee' required className='mb-0'>
                <Input.TextArea
                  rows={5}
                  value={cookieValue}
                  onChange={(e) => setCookieValue(e.target.value)}
                  placeholder='Dán cookie Shopee vào đây...'
                  className='font-mono'
                />
              </Form.Item>
            </Form>
          </Card>

          <Card
            className='rounded-xl border-none shadow-md bg-white/80 backdrop-blur'
            bodyStyle={{ padding: 16 }}
          >
            <Tabs defaultActiveKey='voucher' items={[voucherTab, freeshipTab]} />
          </Card>
        </Space>
      </div>
    </Modal>
  )
}

export default GetVoucher
