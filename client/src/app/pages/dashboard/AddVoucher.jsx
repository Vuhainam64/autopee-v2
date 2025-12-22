import React, { useEffect, useState } from 'react'
import { Button, Typography, Space, Card, Tabs, message, Modal } from 'antd'
import { GiftOutlined, PlusOutlined } from '@ant-design/icons'
import { FaShippingFast } from 'react-icons/fa'
import { post, get, del, put } from '../../services/api.js'
import dayjs from 'dayjs'
import VoucherTable from './components/VoucherTable'
import FreeshipTable from './components/FreeshipTable'
import VoucherForm from './components/VoucherForm'
import FreeshipForm from './components/FreeshipForm'
import JsonImportModal from './components/JsonImportModal'
import { Form } from 'antd'

const { Title } = Typography

function AddVoucher() {
  const [form] = Form.useForm()
  const [freeshipForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [freeshipLoading, setFreeshipLoading] = useState(false)
  const [vouchers, setVouchers] = useState([])
  const [freeships, setFreeships] = useState([])
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [editingFreeship, setEditingFreeship] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [freeshipModalVisible, setFreeshipModalVisible] = useState(false)
  const [jsonModalVisible, setJsonModalVisible] = useState(false)
  const [freeshipJsonModalVisible, setFreeshipJsonModalVisible] = useState(false)
  const [jsonValue, setJsonValue] = useState('')
  const [freeshipJsonValue, setFreeshipJsonValue] = useState('')
  const [activeTab, setActiveTab] = useState('voucher')

  useEffect(() => {
    loadVouchers()
    loadFreeships()
  }, [])

  const loadVouchers = async () => {
    try {
      setLoading(true)
      // Thêm ?admin=true để admin có thể thấy tất cả voucher kể cả bị ẩn
      const response = await get('/shopee/vouchers?limit=200&admin=true')
      
      if (response?.success && Array.isArray(response.data)) {
        setVouchers(response.data)
      } else {
        setVouchers([])
      }
    } catch (e) {
      console.error('Error loading vouchers:', e)
      message.error('Không thể tải danh sách voucher')
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const loadFreeships = async () => {
    try {
      setFreeshipLoading(true)
      const response = await get('/shopee/freeships?limit=200&admin=true')
      
      if (response?.success && Array.isArray(response.data)) {
        setFreeships(response.data)
      } else {
        setFreeships([])
      }
    } catch (e) {
      console.error('Error loading freeships:', e)
      message.error('Không thể tải danh sách freeship')
      setFreeships([])
    } finally {
      setFreeshipLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      
      const voucherData = {
        promotionId: parseInt(values.promotionId),
        voucherCode: values.voucherCode,
        signature: values.signature,
        voucherName: values.voucherName || values.voucherCode,
        description: values.description || '',
        discountValue: values.discountValue || 0,
        discountPercentage: values.discountPercentage || 0,
        discountCap: values.discountCap || 0,
        minSpend: values.minSpend || 0,
        rewardValue: values.rewardValue || 0,
        rewardPercentage: values.rewardPercentage || 0,
        rewardType: values.rewardType || 0,
        startTime: values.startTime ? Math.floor(new Date(values.startTime).getTime() / 1000) : Math.floor(Date.now() / 1000),
        endTime: values.endTime ? Math.floor(new Date(values.endTime).getTime() / 1000) : 0,
        claimStartTime: values.claimStartTime ? Math.floor(new Date(values.claimStartTime).getTime() / 1000) : Math.floor(Date.now() / 1000),
        claimEndTime: values.claimEndTime ? Math.floor(new Date(values.claimEndTime).getTime() / 1000) : 0,
        hasExpired: values.hasExpired || false,
        disabled: values.disabled || false,
        newUserOnly: values.newUserOnly || false,
        shopeeWalletOnly: values.shopeeWalletOnly || false,
        productLimit: values.productLimit || false,
        usageLimit: values.usageLimit || null,
        voucherMarketType: values.voucherMarketType || 1,
        useType: values.useType || 0,
        iconText: values.iconText || '',
        brandingColor: values.brandingColor || '#EE4D2D',
      }

      const response = await post('/shopee/vouchers', voucherData)

      if (response?.success) {
        message.success(editingVoucher ? 'Đã cập nhật voucher' : 'Đã thêm voucher')
        form.resetFields()
        setModalVisible(false)
        setEditingVoucher(null)
        await loadVouchers()
      } else {
        message.error(response?.error?.message || 'Không thể lưu voucher')
      }
    } catch (e) {
      console.error('Error saving voucher:', e)
      message.error('Có lỗi xảy ra khi lưu voucher')
    } finally {
      setLoading(false)
    }
  }

  const handleFreeshipSubmit = async (values) => {
    try {
      setFreeshipLoading(true)
      
      const freeshipData = {
        promotionId: parseInt(values.promotionId),
        voucherCode: values.voucherCode,
        signature: values.signature,
        voucherName: values.voucherName || values.voucherCode,
        description: values.description || '',
        discountValue: values.discountValue || 0,
        discountPercentage: values.discountPercentage || 0,
        discountCap: values.discountCap || 0,
        minSpend: values.minSpend || 0,
        rewardValue: values.rewardValue || 0,
        rewardPercentage: values.rewardPercentage || 0,
        rewardType: values.rewardType || 0,
        startTime: values.startTime ? Math.floor(new Date(values.startTime).getTime() / 1000) : Math.floor(Date.now() / 1000),
        endTime: values.endTime ? Math.floor(new Date(values.endTime).getTime() / 1000) : 0,
        claimStartTime: values.claimStartTime ? Math.floor(new Date(values.claimStartTime).getTime() / 1000) : Math.floor(Date.now() / 1000),
        claimEndTime: values.claimEndTime ? Math.floor(new Date(values.claimEndTime).getTime() / 1000) : 0,
        hasExpired: values.hasExpired || false,
        disabled: values.disabled || false,
        newUserOnly: values.newUserOnly || false,
        shopeeWalletOnly: values.shopeeWalletOnly || false,
        productLimit: values.productLimit || false,
        usageLimit: values.usageLimit || null,
        voucherMarketType: values.voucherMarketType || 2,
        useType: values.useType || 0,
        iconText: values.iconText || 'FREESHIP',
        brandingColor: values.brandingColor || '#EE4D2D',
      }

      const response = await post('/shopee/freeships', freeshipData)

      if (response?.success) {
        message.success(editingFreeship ? 'Đã cập nhật freeship' : 'Đã thêm freeship')
        freeshipForm.resetFields()
        setFreeshipModalVisible(false)
        setEditingFreeship(null)
        await loadFreeships()
      } else {
        message.error(response?.error?.message || 'Không thể lưu freeship')
      }
    } catch (e) {
      console.error('Error saving freeship:', e)
      message.error('Có lỗi xảy ra khi lưu freeship')
    } finally {
      setFreeshipLoading(false)
    }
  }

  const handleEdit = (record) => {
    setEditingVoucher(record)
    form.setFieldsValue({
      promotionId: record.promotionId,
      voucherCode: record.voucherCode,
      signature: record.signature,
      voucherName: record.voucherName,
      description: record.description,
      discountValue: record.discountValue,
      discountPercentage: record.discountPercentage,
      discountCap: record.discountCap,
      minSpend: record.minSpend,
      rewardValue: record.rewardValue,
      rewardPercentage: record.rewardPercentage,
      rewardType: record.rewardType,
      startTime: record.startTime ? dayjs.unix(record.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
      endTime: record.endTime ? dayjs.unix(record.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
      claimStartTime: record.claimStartTime ? dayjs.unix(record.claimStartTime).format('YYYY-MM-DD HH:mm:ss') : null,
      claimEndTime: record.claimEndTime ? dayjs.unix(record.claimEndTime).format('YYYY-MM-DD HH:mm:ss') : null,
      hasExpired: record.hasExpired,
      disabled: record.disabled,
      newUserOnly: record.newUserOnly,
      shopeeWalletOnly: record.shopeeWalletOnly,
      productLimit: record.productLimit,
      usageLimit: record.usageLimit,
      voucherMarketType: record.voucherMarketType,
      useType: record.useType,
      iconText: record.iconText,
      brandingColor: record.brandingColor,
    })
    setModalVisible(true)
  }

  const handleFreeshipEdit = (record) => {
    setEditingFreeship(record)
    freeshipForm.setFieldsValue({
      promotionId: record.promotionId,
      voucherCode: record.voucherCode,
      signature: record.signature,
      voucherName: record.voucherName,
      description: record.description,
      discountValue: record.discountValue,
      discountPercentage: record.discountPercentage,
      discountCap: record.discountCap,
      minSpend: record.minSpend,
      rewardValue: record.rewardValue,
      rewardPercentage: record.rewardPercentage,
      rewardType: record.rewardType,
      startTime: record.startTime ? dayjs.unix(record.startTime).format('YYYY-MM-DD HH:mm:ss') : null,
      endTime: record.endTime ? dayjs.unix(record.endTime).format('YYYY-MM-DD HH:mm:ss') : null,
      claimStartTime: record.claimStartTime ? dayjs.unix(record.claimStartTime).format('YYYY-MM-DD HH:mm:ss') : null,
      claimEndTime: record.claimEndTime ? dayjs.unix(record.claimEndTime).format('YYYY-MM-DD HH:mm:ss') : null,
      hasExpired: record.hasExpired,
      disabled: record.disabled,
      newUserOnly: record.newUserOnly,
      shopeeWalletOnly: record.shopeeWalletOnly,
      productLimit: record.productLimit,
      usageLimit: record.usageLimit,
      voucherMarketType: record.voucherMarketType,
      useType: record.useType,
      iconText: record.iconText,
      brandingColor: record.brandingColor,
    })
    setFreeshipModalVisible(true)
  }

  const handleDelete = async (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa voucher "${record.voucherCode}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await del(`/shopee/vouchers/${record._id}`)
          message.success('Đã xóa voucher')
          await loadVouchers()
        } catch (e) {
          console.error('Error deleting voucher:', e)
          message.error('Không thể xóa voucher')
        }
      },
    })
  }

  const handleFreeshipDelete = async (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa freeship "${record.voucherCode}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await del(`/shopee/freeships/${record._id}`)
          message.success('Đã xóa freeship')
          await loadFreeships()
        } catch (e) {
          console.error('Error deleting freeship:', e)
          message.error('Không thể xóa freeship')
        }
      },
    })
  }

  const handleToggleHidden = async (record, value) => {
    try {
      const response = await put(`/shopee/vouchers/${record._id}/toggle`, {
        field: 'hidden',
        value: value,
      })
      if (response?.success) {
        message.success(value ? 'Đã ẩn voucher' : 'Đã hiện voucher')
        await loadVouchers()
      } else {
        message.error(response?.error?.message || 'Không thể cập nhật')
      }
    } catch (e) {
      console.error('Error toggling hidden:', e)
      message.error('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleToggleExpired = async (record, value) => {
    try {
      const response = await put(`/shopee/vouchers/${record._id}/toggle`, {
        field: 'hasExpired',
        value: value,
      })
      if (response?.success) {
        message.success(value ? 'Đã đánh dấu hết hạn' : 'Đã bỏ đánh dấu hết hạn')
        await loadVouchers()
      } else {
        message.error(response?.error?.message || 'Không thể cập nhật')
      }
    } catch (e) {
      console.error('Error toggling expired:', e)
      message.error('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleFreeshipToggleHidden = async (record, value) => {
    try {
      const response = await put(`/shopee/freeships/${record._id}/toggle`, {
        field: 'hidden',
        value: value,
      })
      if (response?.success) {
        message.success(value ? 'Đã ẩn freeship' : 'Đã hiện freeship')
        await loadFreeships()
      } else {
        message.error(response?.error?.message || 'Không thể cập nhật')
      }
    } catch (e) {
      console.error('Error toggling hidden:', e)
      message.error('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleFreeshipToggleExpired = async (record, value) => {
    try {
      const response = await put(`/shopee/freeships/${record._id}/toggle`, {
        field: 'hasExpired',
        value: value,
      })
      if (response?.success) {
        message.success(value ? 'Đã đánh dấu hết hạn' : 'Đã bỏ đánh dấu hết hạn')
        await loadFreeships()
      } else {
        message.error(response?.error?.message || 'Không thể cập nhật')
      }
    } catch (e) {
      console.error('Error toggling expired:', e)
      message.error('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleImportFromJson = async () => {
    try {
      if (!jsonValue.trim()) {
        message.error('Vui lòng nhập JSON')
        return
      }

      setLoading(true)

      let jsonData
      try {
        jsonData = JSON.parse(jsonValue)
      } catch (e) {
        message.error('JSON không hợp lệ')
        return
      }

      if (!jsonData.data || !jsonData.data.voucher_basic_info) {
        message.error('JSON không đúng định dạng. Cần có data.voucher_basic_info')
        return
      }

      const voucherInfo = jsonData.data.voucher_basic_info
      const usageTerm = jsonData.data.voucher_usage_term || {}

      // Xác định loại: freeship nếu:
      // 1. icon_text === 'FREESHIP' hoặc 'Mã vận chuyển'
      // 2. voucher_market_type === 2
      // 3. reward_type === 2 và có fsv_voucher_card_ui_info
      const iconText = voucherInfo.icon_text || '';
      const isFreeship = 
        iconText === 'FREESHIP' || 
        iconText === 'Mã vận chuyển' ||
        voucherInfo.voucher_market_type === 2 ||
        (voucherInfo.reward_type === 2 && voucherInfo.fsv_voucher_card_ui_info);

      // Xử lý discount value từ fsv_voucher_card_ui_info nếu là freeship
      let discountValue = voucherInfo.discount_value ? Math.floor(voucherInfo.discount_value / 100000) : 0;
      if (isFreeship && voucherInfo.fsv_voucher_card_ui_info?.composed_discount_value) {
        discountValue = Math.floor(voucherInfo.fsv_voucher_card_ui_info.composed_discount_value / 100000);
      }

      const voucherData = {
        promotionId: voucherInfo.promotionid,
        voucherCode: voucherInfo.voucher_code,
        signature: voucherInfo.signature,
        voucherName: voucherInfo.title || voucherInfo.voucher_code,
        description: usageTerm.description || voucherInfo.description || '',
        discountValue: discountValue,
        discountPercentage: voucherInfo.discount_percentage || 0,
        discountCap: voucherInfo.discount_cap ? Math.floor(voucherInfo.discount_cap / 100000) : 0,
        minSpend: voucherInfo.min_spend ? Math.floor(voucherInfo.min_spend / 100000) : 0,
        rewardValue: voucherInfo.reward_value ? Math.floor(voucherInfo.reward_value / 100000) : 0,
        rewardPercentage: voucherInfo.reward_percentage || 0,
        rewardType: voucherInfo.reward_type || 0,
        startTime: voucherInfo.start_time || 0,
        endTime: voucherInfo.end_time || 0,
        claimStartTime: voucherInfo.claim_start_time || 0,
        claimEndTime: voucherInfo.claim_end_time || 0,
        hasExpired: voucherInfo.has_expired || false,
        disabled: voucherInfo.disabled || false,
        fullyRedeemed: voucherInfo.fully_redeemed || false,
        fullyClaimed: voucherInfo.fully_claimed || false,
        fullyUsed: voucherInfo.fully_used || false,
        newUserOnly: voucherInfo.new_user_only || false,
        shopeeWalletOnly: voucherInfo.shopee_wallet_only || false,
        productLimit: voucherInfo.product_limit || false,
        usageLimit: voucherInfo.usage_limit || null,
        usedCount: voucherInfo.used_count || 0,
        leftCount: voucherInfo.left_count || null,
        voucherMarketType: voucherInfo.voucher_market_type || (isFreeship ? 2 : 1),
        useType: voucherInfo.use_type || 0,
        iconText: voucherInfo.icon_text || (isFreeship ? 'FREESHIP' : ''),
        iconHash: voucherInfo.icon_hash || '',
        customisedLabels: (voucherInfo.customised_labels || []).map(label => label.content || label),
        brandingColor: voucherInfo.branding_color || '#EE4D2D',
        customerReferenceId: voucherInfo.customer_reference_id || null,
        shopId: voucherInfo.shop_id || 0,
        shopName: voucherInfo.shop_name || null,
        rawData: jsonData.data,
      }

      const endpoint = isFreeship ? '/shopee/freeships' : '/shopee/vouchers';
      const response = await post(endpoint, voucherData)

      if (response?.success) {
        message.success(`Đã import ${isFreeship ? 'freeship' : 'voucher'} thành công`)
        setJsonModalVisible(false)
        setJsonValue('')
        if (isFreeship) {
          await loadFreeships()
        } else {
          await loadVouchers()
        }
      } else {
        message.error(response?.error?.message || `Không thể import ${isFreeship ? 'freeship' : 'voucher'}`)
      }
    } catch (e) {
      console.error('Error importing voucher from JSON:', e)
      message.error('Có lỗi xảy ra khi import voucher')
    } finally {
      setLoading(false)
    }
  }

  const handleFreeshipImportFromJson = async () => {
    try {
      if (!freeshipJsonValue.trim()) {
        message.error('Vui lòng nhập JSON')
        return
      }

      setFreeshipLoading(true)

      let jsonData
      try {
        jsonData = JSON.parse(freeshipJsonValue)
      } catch (e) {
        message.error('JSON không hợp lệ')
        return
      }

      if (!jsonData.data || !jsonData.data.voucher_basic_info) {
        message.error('JSON không đúng định dạng. Cần có data.voucher_basic_info')
        return
      }

      const voucherInfo = jsonData.data.voucher_basic_info
      const usageTerm = jsonData.data.voucher_usage_term || {}

      // Xử lý discount value từ fsv_voucher_card_ui_info nếu có
      let discountValue = voucherInfo.discount_value ? Math.floor(voucherInfo.discount_value / 100000) : 0;
      if (voucherInfo.fsv_voucher_card_ui_info?.composed_discount_value) {
        discountValue = Math.floor(voucherInfo.fsv_voucher_card_ui_info.composed_discount_value / 100000);
      }

      const freeshipData = {
        promotionId: voucherInfo.promotionid,
        voucherCode: voucherInfo.voucher_code,
        signature: voucherInfo.signature,
        voucherName: voucherInfo.title || voucherInfo.voucher_code,
        description: usageTerm.description || voucherInfo.description || '',
        discountValue: discountValue,
        discountPercentage: voucherInfo.discount_percentage || 0,
        discountCap: voucherInfo.discount_cap ? Math.floor(voucherInfo.discount_cap / 100000) : 0,
        minSpend: voucherInfo.min_spend ? Math.floor(voucherInfo.min_spend / 100000) : 0,
        rewardValue: voucherInfo.reward_value ? Math.floor(voucherInfo.reward_value / 100000) : 0,
        rewardPercentage: voucherInfo.reward_percentage || 0,
        rewardType: voucherInfo.reward_type || 0,
        startTime: voucherInfo.start_time || 0,
        endTime: voucherInfo.end_time || 0,
        claimStartTime: voucherInfo.claim_start_time || 0,
        claimEndTime: voucherInfo.claim_end_time || 0,
        hasExpired: voucherInfo.has_expired || false,
        disabled: voucherInfo.disabled || false,
        fullyRedeemed: voucherInfo.fully_redeemed || false,
        fullyClaimed: voucherInfo.fully_claimed || false,
        fullyUsed: voucherInfo.fully_used || false,
        newUserOnly: voucherInfo.new_user_only || false,
        shopeeWalletOnly: voucherInfo.shopee_wallet_only || false,
        productLimit: voucherInfo.product_limit || false,
        usageLimit: voucherInfo.usage_limit || null,
        usedCount: voucherInfo.used_count || 0,
        leftCount: voucherInfo.left_count || null,
        voucherMarketType: voucherInfo.voucher_market_type || 2,
        useType: voucherInfo.use_type || 0,
        iconText: voucherInfo.icon_text || 'FREESHIP',
        iconHash: voucherInfo.icon_hash || '',
        customisedLabels: (voucherInfo.customised_labels || []).map(label => label.content || label),
        brandingColor: voucherInfo.branding_color || '#EE4D2D',
        customerReferenceId: voucherInfo.customer_reference_id || null,
        shopId: voucherInfo.shop_id || 0,
        shopName: voucherInfo.shop_name || null,
        rawData: jsonData.data,
      }

      const response = await post('/shopee/freeships', freeshipData)

      if (response?.success) {
        message.success('Đã import freeship thành công')
        setFreeshipJsonModalVisible(false)
        setFreeshipJsonValue('')
        await loadFreeships()
      } else {
        message.error(response?.error?.message || 'Không thể import freeship')
      }
    } catch (e) {
      console.error('Error importing freeship from JSON:', e)
      message.error('Có lỗi xảy ra khi import freeship')
    } finally {
      setFreeshipLoading(false)
    }
  }

  const voucherTabContent = (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Space>
          <Button
            onClick={() => {
              setJsonValue('')
              setJsonModalVisible(true)
            }}
          >
            Thêm từ JSON
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields()
              setEditingVoucher(null)
              setModalVisible(true)
            }}
          >
            Thêm voucher
          </Button>
        </Space>
      </div>
      <VoucherTable
        loading={loading}
        vouchers={vouchers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleHidden={handleToggleHidden}
        onToggleExpired={handleToggleExpired}
      />
    </>
  )

  const freeshipTabContent = (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Space>
          <Button
            onClick={() => {
              setFreeshipJsonValue('')
              setFreeshipJsonModalVisible(true)
            }}
          >
            Thêm từ JSON
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              freeshipForm.resetFields()
              setEditingFreeship(null)
              setFreeshipModalVisible(true)
            }}
          >
            Thêm freeship
          </Button>
        </Space>
      </div>
      <FreeshipTable
        loading={freeshipLoading}
        freeships={freeships}
        onEdit={handleFreeshipEdit}
        onDelete={handleFreeshipDelete}
        onToggleHidden={handleFreeshipToggleHidden}
        onToggleExpired={handleFreeshipToggleExpired}
      />
    </>
  )

  return (
    <div>
      <div className="mb-6">
        <Title level={2} className="mb-0">
          Quản lý Voucher & Freeship Shopee
        </Title>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'voucher',
              label: (
                <span className="flex items-center">
                  <GiftOutlined className="mr-2" />
                  Voucher
                </span>
              ),
              children: voucherTabContent,
            },
            {
              key: 'freeship',
              label: (
                <span className="flex items-center">
                  <FaShippingFast className="mr-2" />
                  Freeship
                </span>
              ),
              children: freeshipTabContent,
            },
          ]}
        />
      </Card>

      <VoucherForm
        visible={modalVisible}
        editingVoucher={editingVoucher}
        loading={loading}
        form={form}
        onCancel={() => {
          setModalVisible(false)
          setEditingVoucher(null)
          form.resetFields()
        }}
        onSubmit={handleSubmit}
      />

      <FreeshipForm
        visible={freeshipModalVisible}
        editingFreeship={editingFreeship}
        loading={freeshipLoading}
        form={freeshipForm}
        onCancel={() => {
          setFreeshipModalVisible(false)
          setEditingFreeship(null)
          freeshipForm.resetFields()
        }}
        onSubmit={handleFreeshipSubmit}
      />

      <JsonImportModal
        visible={jsonModalVisible}
        type="voucher"
        jsonValue={jsonValue}
        loading={loading}
        onChange={(e) => setJsonValue(e.target.value)}
        onCancel={() => {
          setJsonModalVisible(false)
          setJsonValue('')
        }}
        onSubmit={handleImportFromJson}
      />

      <JsonImportModal
        visible={freeshipJsonModalVisible}
        type="freeship"
        jsonValue={freeshipJsonValue}
        loading={freeshipLoading}
        onChange={(e) => setFreeshipJsonValue(e.target.value)}
        onCancel={() => {
          setFreeshipJsonModalVisible(false)
          setFreeshipJsonValue('')
        }}
        onSubmit={handleFreeshipImportFromJson}
      />
    </div>
  )
}

export default AddVoucher
