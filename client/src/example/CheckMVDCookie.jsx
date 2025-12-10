import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Select, Form, message, Input } from 'antd'
import { toast } from 'react-toastify'
import { utils as XLSXUtils, writeFile as writeExcelFile } from 'xlsx'

import { FaFileImport, FaGift, FaQrcode, FaCoins } from 'react-icons/fa'
import { IoCloudDownload } from 'react-icons/io5'
import { FcDeleteDatabase } from 'react-icons/fc'
import { SiMicrosoftexcel } from 'react-icons/si'
import { MdCookie } from 'react-icons/md'
import { Bill, Cuba } from '../../assets'
import GetVoucher from './function/GetVoucher'
import GetVoucherWithCoin from './function/GetVoucherWithCoin'

import {
  generateQRCode,
  checkQRCode,
  loginQRCode,
  getOrderDetailsForCookie,
  checkPhone,
} from '../../api/checkmvd'
import { cancelOrder, requestReturn, returnInfo } from '../../api/return_request'
import { Link } from 'react-router-dom'

const { Option } = Select

const CheckMVDCookie = () => {
  const [qrCodeBase64, setQrCodeBase64] = useState('')
  const [loadingQR, setLoadingQR] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [cookie, setCookie] = useState('')
  const [orderDetails, setOrderDetails] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [manualCookies, setManualCookies] = useState('')
  const [isManualCookieVisible, setIsManualCookieVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [returnReasons, setReturnReasons] = useState([])
  const [selectedReason, setSelectedReason] = useState(null)
  const [modalTitle, setModalTitle] = useState('')
  const [currentRecord, setCurrentRecord] = useState(null)
  const [itemDetails, setItemDetails] = useState(null)
  const [isShopeeModalVisible, setShopeeModalVisible] = useState(false)
  const [shopeeNumber, setShopeeNumber] = useState('')
  const [shopeeCheckResult, setShopeeCheckResult] = useState(null)
  const [isRedbullModalVisible, setRedbullModalVisible] = useState(false)
  const [billCount, setBillCount] = useState(1)
  const [generatedBills, setGeneratedBills] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVoucherModalVisible, setIsVoucherModalVisible] = useState(false)
  const [isVoucherWithCoinModalVisible, setIsVoucherWithCoinModalVisible] = useState(false)
  const [isFeeNoticeVisible, setIsFeeNoticeVisible] = useState(false)

  // Kiểm tra và hiển thị popup thông báo thu phí
  useEffect(() => {
    const feeNoticeDismissed = localStorage.getItem('feeNoticeDismissed')
    if (!feeNoticeDismissed) {
      // Delay 1 giây để trang load xong
      const timer = setTimeout(() => {
        setIsFeeNoticeVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Lắng nghe sự kiện bàn phím Ctrl+M và Ctrl+X
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault()
        setIsVoucherModalVisible(true)
      }
      if (event.ctrlKey && event.key === 'x') {
        event.preventDefault()
        setIsVoucherWithCoinModalVisible(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleCheckShopeeNumber = async () => {
    if (!shopeeNumber) return

    try {
      // Xử lý số điện thoại: chỉ giữ lại 9 số cuối
      let processedPhone = shopeeNumber.replace(/\D/g, '') // Loại bỏ tất cả ký tự không phải số

      // Nếu số có 10-11 chữ số và bắt đầu bằng 0 hoặc 84, chỉ giữ 9 số cuối
      if (processedPhone.length >= 10) {
        if (processedPhone.startsWith('84')) {
          processedPhone = processedPhone.substring(2) // Bỏ 84, giữ 9 số cuối
        } else if (processedPhone.startsWith('0')) {
          processedPhone = processedPhone.substring(1) // Bỏ 0, giữ 9 số cuối
        }
      }

      // Đảm bảo chỉ có 9 số
      if (processedPhone.length > 9) {
        processedPhone = processedPhone.slice(-9) // Lấy 9 số cuối cùng
      }

      const response = await fetch(
        `https://us-central1-get-feedback-a0119.cloudfunctions.net/app/api/shopee/check-phone-shopee?phone=${processedPhone}`
      )
      const result = await response.json()

      if (result.resolve === true) {
        toast.success('Số này dùng được!')
      } else {
        toast.warning('Số này không dùng được')
      }
      setShopeeCheckResult(result)
    } catch (error) {
      toast.error('Lỗi khi check số Shopee')
      console.error('Error checking Shopee number:', error)
    }
  }

  const filteredOrderDetails = orderDetails.filter(
    (order) =>
      order.product_info &&
      order.product_info.length > 0 &&
      order.product_info[0].name.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleSearch = (e) => {
    setSearchText(e.target.value)
  }

  const openManualCookiePopup = () => {
    setIsManualCookieVisible(true)
  }

  const closeManualCookiePopup = () => {
    setIsManualCookieVisible(false)
  }

  const handleDeleteCookie = (cookieToDelete) => {
    setOrderDetails((prevOrderDetails) =>
      prevOrderDetails.filter((orderDetail) => orderDetail.cookie !== cookieToDelete)
    )
  }

  const handleDeleteDuplicates = () => {
    const seenCookies = new Set()
    const filteredOrderDetails = []

    orderDetails.forEach((orderDetail) => {
      if (!seenCookies.has(orderDetail.cookie)) {
        seenCookies.add(orderDetail.cookie)
        filteredOrderDetails.push(orderDetail)
      }
    })

    setOrderDetails(filteredOrderDetails)
  }

  const fetchQRCode = async () => {
    setLoadingQR(true)
    try {
      const qrData = await generateQRCode()
      if (qrData && qrData.qrcode_base64 && qrData.qrcode_id) {
        setQrCodeBase64(qrData.qrcode_base64)
        setQrData(qrData)
        setIsModalVisible(true)
        await pollQRCodeStatus(qrData.qrcode_id)
      }
    } catch (error) {
      toast.error('Lỗi khi tạo QR code:', error)
    }
    setLoadingQR(false)
  }

  const pollQRCodeStatus = async (qrcodeId) => {
    for (let i = 0; i < 12; i++) {
      try {
        const statusData = await checkQRCode(qrcodeId)
        if (statusData && statusData.status === 'CONFIRMED') {
          const qrcodeToken = statusData.qrcode_token
          const loginData = await loginQRCode(qrcodeToken)
          if (loginData && loginData.cookie) {
            setCookie(loginData.cookie)
            setIsModalVisible(false)
            await fetchOrderDetails([loginData.cookie])
          }
          break
        }
      } catch (error) {
        toast.error('Lỗi khi kiểm tra trạng thái QR code:', error)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }

  const handleImportCookie = async (e) => {
    const file = e.target.files[0]
    const text = await file.text()
    const cookies = text
      .split('\n')
      .map((cookie) => cookie.trim().replace('\r', ''))
      .filter((cookie) => cookie !== '')

    await fetchOrderDetails(cookies)
  }

  const fetchOrderDetails = async (cookiesArray) => {
    try {
      const payload = { cookies: cookiesArray }
      const data = await getOrderDetailsForCookie(payload)
      if (data && data.allOrderDetails) {
        const newOrders = []
        data.allOrderDetails.forEach((order) => {
          if (order?.data && order?.data?.error === 'DeadCookie') {
            newOrders.push({
              order_id: 'DeadCookie',
              tracking_number: 'DeadCookie',
              tracking_info_description: 'DeadCookie',
              address: {
                shipping_name: 'DeadCookie',
                shipping_phone: 'DeadCookie',
                shipping_address: 'DeadCookie',
              },
              cookie: order.cookie,
              noOrder: true,
            })
          } else {
            order.orderDetails.forEach((orderDetail) => {
              orderDetail.cookie = order.cookie
              newOrders.push(orderDetail)
            })
          }
        })

        setOrderDetails((prevOrders) => [...prevOrders, ...newOrders])
      } else {
        toast.error("Dữ liệu trả về từ API không có thuộc tính 'allOrderDetails'.")
      }
    } catch (error) {
      toast.error('Lỗi khi lấy chi tiết đơn hàng:', error)
    }
  }

  const formatDateTime = () => {
    const date = new Date()

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}_${hours}${minutes}${seconds}`
  }

  const downloadCookie = (cookie) => {
    const dateTimeString = formatDateTime()
    const fileName = `cookie_${dateTimeString}.txt`

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

  const downloadAllCookies = () => {
    const dateTimeString = formatDateTime()
    const fileName = `all_cookies_${dateTimeString}.txt`
    const allCookies = orderDetails.map((orderDetail) => orderDetail.cookie)
    const uniqueCookies = [...new Set(allCookies)]
    const cookiesString = uniqueCookies.join('\n')

    const blob = new Blob([cookiesString], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const submitManualCookies = () => {
    const cookiesArray = manualCookies
      .split('\n')
      .map((cookie) => cookie.trim())
      .filter((cookie) => cookie !== '')

    fetchOrderDetails(cookiesArray)
    closeManualCookiePopup()
  }

  const createExcelFile = (orderDetails) => {
    if (!orderDetails || orderDetails.length === 0) {
      console.error('Order details are empty or undefined.', orderDetails)
      return
    }

    console.log('orderDetails2: ', orderDetails)
    const data = orderDetails.map((order, index) => {
      return {
        STT: index,
        tracking_number: order.tracking_number || '',
        tracking_info_description: order.tracking_info_description || '',
        shipping_name: order.address?.shipping_name || '',
        shipping_phone: order.address?.shipping_phone || '',
        shipping_address: order.address?.shipping_address || '',
        cookie: order.cookie,
      }
    })

    const worksheet = XLSXUtils.json_to_sheet(data)
    const headers = [
      'STT',
      'tracking_number',
      'tracking_info_description',
      'shipping_name',
      'shipping_phone',
      'shipping_address',
      'cookie',
    ]

    XLSXUtils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' })
    const workbook = XLSXUtils.book_new()
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const excelFileName = 'output.xlsx'
    writeExcelFile(workbook, excelFileName)
  }

  // Hàm gọi API returnInfo
  const fetchReturnInfo = async (record) => {
    try {
      const response = await returnInfo(record.cookie, record.order_id)
      console.log('response: ', response.return_reasons.return_reasons)

      setReturnReasons(response.return_reasons.return_reasons)
      setModalTitle(response.return_reasons.title)
      setSelectedReason(response.return_reasons.return_reasons.selected_return_reason)
      setItemDetails(response.item_details)
    } catch (error) {
      toast.error('Không thể tải thông tin hoàn trả')
    }
  }

  const handleOpenModal = async (record) => {
    setCurrentRecord(record)
    setIsModalOpen(true)
    await fetchReturnInfo(record)
  }

  const handleConfirmCancel = async () => {
    if (!selectedReason) {
      toast.warning('Vui lòng chọn lý do')
      return
    }

    try {
      const returnRes = await requestReturn(
        currentRecord.order_id,
        currentRecord.cookie,
        itemDetails.refund_price,
        selectedReason,
        itemDetails.item_id,
        itemDetails.model_id,
        itemDetails.line_item_id
      )
      console.log(itemDetails)
      console.log(selectedReason)
      if (returnRes.error === 0) {
        toast.success('Đã gửi yêu cầu hoàn trả')
        setIsModalVisible(false)
      } else {
        toast.error('Không thể gửi yêu cầu hoàn trả')
        console.log(returnRes)
      }
    } catch (error) {
      toast.error('Không thể hoàn trả đơn hàng')
    }
  }

  const handleCancelOrder = async (record) => {
    console.log(record.order_id, record.cookie)
    const cancelOrderRes = cancelOrder(record.order_id, record.cookie)
    if (cancelOrderRes) {
      toast.success('Đã hủy đơn hàng')
    } else {
      toast.error('Không thể hủy đơn hàng')
    }
  }

  // Hàm tạo transaction ID theo format
  const generateTransactionId = (customId = null) => {
    if (customId) {
      return customId
    }

    const currentYear = new Date().getFullYear()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    const currentDay = String(new Date().getDate()).padStart(2, '0')

    // Random 4 chữ số đầu
    const random4DigitsFirst = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')

    // Random 4 chữ số cuối
    const random4DigitsLast = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')

    return `7193528-${random4DigitsFirst}-${currentYear}-${currentMonth}${currentDay}-${random4DigitsLast}`
  }

  // Hàm tạo bill với canvas
  const generateBillImage = async (transactionId) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Tạo image object
      const img = new Image()
      img.crossOrigin = 'anonymous'

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Set canvas size to match image
          canvas.width = img.width
          canvas.height = img.height

          // Draw original image
          ctx.drawImage(img, 0, 0)

          // Add transaction ID text
          ctx.fillStyle = '#1b1d1c'
          ctx.font = 'bold 50px Arial'
          ctx.textAlign = 'center'

          // Calculate position (center horizontally, specific vertical position)
          const textX = canvas.width / 2.3
          const textY = canvas.height / 1.84

          // Draw transaction ID
          ctx.fillText(transactionId, textX, textY)

          // Convert to blob and create URL
          canvas.toBlob(
            (blob) => {
              const url = URL.createObjectURL(blob)
              resolve(url)
            },
            'image/jpeg',
            0.9
          )
        }

        img.onerror = () => {
          reject(new Error('Failed to load bill image'))
        }

        img.src = Bill
      })
    } catch (error) {
      throw new Error('Failed to generate bill image: ' + error.message)
    }
  }

  // Xử lý tạo bill Redbull
  const handleGenerateRedbullBill = async () => {
    if (!billCount || billCount < 1 || billCount > 50) {
      toast.warning('Vui lòng nhập số lượng hóa đơn từ 1 đến 50')
      return
    }

    setIsGenerating(true)
    const newBills = []

    try {
      for (let i = 1; i <= billCount; i++) {
        toast.info(`Đang tạo hóa đơn ${i}/${billCount}...`)

        const transactionId = generateTransactionId()
        const billImageUrl = await generateBillImage(transactionId)

        newBills.push({
          id: i,
          transactionId,
          imageUrl: billImageUrl,
          fileName: `redbull_bill_${i}_${Date.now()}.jpg`,
        })

        // Delay nhỏ giữa các lần tạo để tránh lag
        if (i < billCount) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      setGeneratedBills(newBills)
      toast.success(`Đã tạo ${billCount} hóa đơn Redbull thành công!`)
    } catch (error) {
      toast.error('Lỗi khi tạo hóa đơn: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Tải xuống 1 bill cụ thể
  const downloadSingleBill = (bill) => {
    const link = document.createElement('a')
    link.href = bill.imageUrl
    link.download = bill.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Tải xuống tất cả bills
  const downloadAllBills = () => {
    if (generatedBills.length === 0) return

    generatedBills.forEach((bill, index) => {
      setTimeout(() => {
        downloadSingleBill(bill)
      }, index * 500) // Delay giữa các lần tải để tránh spam
    })

    toast.success(`Đang tải xuống ${generatedBills.length} hóa đơn...`)
  }

  // Đóng modal Redbull
  const closeRedbullModal = () => {
    setRedbullModalVisible(false)
    setBillCount(1)

    // Cleanup URLs để tránh memory leak
    generatedBills.forEach((bill) => {
      URL.revokeObjectURL(bill.imageUrl)
    })
    setGeneratedBills([])
  }

  // Xử lý popup thông báo thu phí
  const handleCloseFeeNotice = () => {
    setIsFeeNoticeVisible(false)
  }

  const handleDismissFeeNoticePermanently = () => {
    localStorage.setItem('feeNoticeDismissed', 'true')
    setIsFeeNoticeVisible(false)
  }

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
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
      dataIndex: 'address',
      key: 'shipping_name',
      render: (address, record) => (record.noOrder ? 'N/A' : address.shipping_name),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'address',
      key: 'shipping_phone',
      render: (address, record) => (record.noOrder ? 'N/A' : address.shipping_phone),
    },
    {
      title: 'Hình',
      key: 'image',
      render: (text, record) => {
        if (record.product_info && record.product_info.length > 0) {
          return (
            <div>
              <img
                src={`https://cf.shopee.vn/file/${record.product_info[0].image}`}
                alt='Hình ảnh'
                style={{ width: 100, height: 'auto' }}
              />
            </div>
          )
        } else {
          return 'N/A'
        }
      },
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (text, record) => {
        if (record.product_info && record.product_info.length > 0) {
          return record.product_info[0].name
        } else {
          return 'N/A'
        }
      },
    },
    {
      title: 'Địa chỉ giao hàng',
      dataIndex: 'address',
      key: 'shipping_address',
      render: (address, record) => (record.noOrder ? 'N/A' : address.shipping_address),
    },
    {
      title: 'Chức năng',
      key: 'download_cookie',
      render: (text, record) => (
        <div className='flex flex-col space-y-4 px-4'>
          <Button onClick={() => downloadCookie(record.cookie)} className='bg-blue-400 text-white'>
            Tải Cookie
          </Button>
          <Button onClick={() => handleCancelOrder(record)} className='bg-yellow-400 text-white'>
            Huỷ đơn xác nhận
          </Button>
          <Button onClick={() => handleOpenModal(record)} className='bg-yellow-500 text-white'>
            Huỷ đơn đang giao
          </Button>
          <Button
            type='danger'
            onClick={() => handleDeleteCookie(record.cookie)}
            className='bg-red-400 text-white'
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className='w-screen h-screen flex flex-col justify-between items-center'>
      {/* Header */}
      <header className='py-4 text-white text-2xl bg-gray-800 w-full text-center'>
        Tracking MVD With Cookie
      </header>

      {/* Body */}
      <div className='flex-grow w-full p-4'>
        <div className='flex gap-4 justify-center mb-4 flex-wrap'>
          <Button type='primary' onClick={fetchQRCode} loading={loadingQR}>
            <div className='flex items-center justify-between space-x-2'>
              <FaQrcode /> <div>Tạo QR Code</div>
            </div>
          </Button>

          <input
            type='file'
            accept='.txt'
            onChange={handleImportCookie}
            style={{ display: 'none' }}
            id='import-cookie'
          />
          <Button
            type='default'
            className='bg-green-500 text-white'
            onClick={() => document.getElementById('import-cookie').click()}
          >
            <div className='flex items-center justify-between space-x-2'>
              <FaFileImport /> <div>Nhập Cookie</div>
            </div>
          </Button>

          {/* Nút tải xuống tất cả cookies */}
          <Button className='bg-green-500 text-white' onClick={downloadAllCookies}>
            <div className='flex items-center justify-between space-x-2'>
              <IoCloudDownload /> <div>Tải Toàn Bộ Cookie</div>
            </div>
          </Button>

          {/* Nút xóa tất cả trùng lặp */}
          <Button className='bg-red-400 text-white' onClick={handleDeleteDuplicates}>
            <div className='flex items-center justify-between space-x-2'>
              <FcDeleteDatabase /> <div>Xoá Trùng Lặp</div>
            </div>
          </Button>

          <Button
            type='default'
            className='bg-yellow-500 text-white'
            onClick={openManualCookiePopup}
          >
            <div className='flex items-center justify-between space-x-2'>
              <MdCookie />
              <div>Nhập Cookie Thủ Công</div>
            </div>
          </Button>
          {/* excel  */}
          <Button
            className='flex items-center justify-between space-x-2 bg-blue-400 text-white'
            onClick={() => createExcelFile(orderDetails)}
          >
            <SiMicrosoftexcel />
            <div>Xuất Excel</div>
          </Button>

          {/* Nút Check số Shopee */}
          <Button
            className='flex items-center justify-between space-x-2 bg-purple-500 text-white'
            onClick={() => setShopeeModalVisible(true)}
          >
            <div>Check số Shopee</div>
          </Button>
          <div className='flex gap-4 justify-center mb-4 flex-wrap'>
            {/* Các nút khác */}

            <Button
              type='default'
              className='bg-red-600 text-white'
              onClick={() => setRedbullModalVisible(true)}
            >
              <div className='flex items-center justify-between space-x-2'>
                <FaGift />
                <div>Lấy hóa đơn Redbull</div>
              </div>
            </Button>
          </div>
        </div>

        <div className='py-4'>
          <Input
            placeholder='Tìm kiếm'
            value={searchText}
            onChange={handleSearch}
            className='w-225 border-gray-400 outline-none'
          />
        </div>

        {/* Hiển thị QR code */}
        <Modal
          title='QR Code'
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <img src={`data:image/png;base64,${qrCodeBase64}`} alt='QR Code' />
        </Modal>
        <Modal
          title='Nhập Cookie Thủ Công'
          open={isManualCookieVisible}
          onCancel={closeManualCookiePopup}
          footer={[
            <Button key='submit' type='primary' onClick={submitManualCookies}>
              Submit
            </Button>,
          ]}
        >
          <textarea
            rows={6}
            value={manualCookies}
            onChange={(e) => setManualCookies(e.target.value)}
            placeholder='Nhập các Cookie vào đây, mỗi Cookie một dòng'
            className='outline-none w-full h-full border-b'
          />
        </Modal>
        {/* Modal Check số Shopee */}
        <Modal
          title='Check số Shopee'
          open={isShopeeModalVisible}
          onCancel={() => setShopeeModalVisible(false)}
          footer={[
            <Button
              key='check'
              type='primary'
              onClick={handleCheckShopeeNumber}
              className='bg-blue-500 text-white hover:bg-blue-600'
            >
              Check
            </Button>,
            <Button
              key='close'
              onClick={() => setShopeeModalVisible(false)}
              className='bg-gray-300 text-gray-700 hover:bg-gray-400'
            >
              Đóng
            </Button>,
          ]}
        >
          <div className='space-y-4'>
            <Input
              placeholder='Nhập số Shopee'
              value={shopeeNumber}
              onChange={(e) => setShopeeNumber(e.target.value)}
              className='w-full px-4 py-2 border rounded border-gray-300 outline-none focus:ring focus:ring-blue-500'
            />
            {shopeeCheckResult && (
              <div
                className={`text-sm font-medium ${
                  shopeeCheckResult.resolve === true ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {shopeeCheckResult.resolve === true ? (
                  'Số này dùng được!'
                ) : (
                  <div>
                    <div className='text-red-500 mb-2'>Số này không dùng được</div>
                    {shopeeCheckResult.error_code && (
                      <div className='text-xs text-gray-500'>
                        Mã lỗi: {shopeeCheckResult.error_code}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Modal Redbull Bill Generator */}
        <Modal
          title='Tạo hóa đơn Redbull'
          open={isRedbullModalVisible}
          onCancel={closeRedbullModal}
          footer={[
            <Button
              key='generate'
              type='primary'
              onClick={handleGenerateRedbullBill}
              loading={isGenerating}
              disabled={isGenerating}
            >
              {isGenerating ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </Button>,
            generatedBills.length > 0 && (
              <Button
                key='downloadAll'
                className='bg-green-500 text-white'
                onClick={downloadAllBills}
              >
                Tải tất cả ({generatedBills.length})
              </Button>
            ),
            <Button key='close' onClick={closeRedbullModal}>
              Đóng
            </Button>,
          ]}
          width={800}
        >
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Số lượng hóa đơn muốn tạo:</label>
              <Input
                type='number'
                placeholder='Nhập số lượng (1-50)'
                value={billCount}
                onChange={(e) => setBillCount(parseInt(e.target.value) || 1)}
                className='w-full'
                min={1}
                max={50}
                disabled={isGenerating}
              />
              <p className='text-xs text-gray-500 mt-1'>Tối đa 50 hóa đơn mỗi lần</p>
            </div>

            {generatedBills.length > 0 && (
              <div>
                <p className='mb-3 text-sm font-medium'>Đã tạo {generatedBills.length} hóa đơn:</p>
                <div className='grid grid-cols-2 gap-4 max-h-96 overflow-y-auto'>
                  {generatedBills.map((bill) => (
                    <div key={bill.id} className='border rounded p-2'>
                      <div className='text-xs text-gray-600 mb-1'>
                        Hóa đơn #{bill.id} - {bill.transactionId}
                      </div>
                      <img
                        src={bill.imageUrl}
                        alt={`Redbull Bill ${bill.id}`}
                        className='w-full h-auto border rounded shadow-sm cursor-pointer'
                        style={{ maxHeight: '150px' }}
                        onClick={() => downloadSingleBill(bill)}
                        title='Click để tải xuống'
                      />
                      <Button
                        size='small'
                        className='w-full mt-1 text-xs'
                        onClick={() => downloadSingleBill(bill)}
                      >
                        Tải #{bill.id}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Bảng kết quả */}
        <Table
          dataSource={filteredOrderDetails}
          columns={columns}
          rowKey='order_id'
          pagination={{
            position: ['bottomRight'],
            pageSize: 100,
          }}
          bordered
          size='middle'
          scroll={{ x: 'calc(700px + 50%)', y: 600 }}
        />
        <Modal
          title={modalTitle}
          open={isModalOpen}
          onOk={handleConfirmCancel}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form>
            <Form.Item label='Chọn lý do'>
              <Select
                value={selectedReason}
                onChange={(value) => setSelectedReason(value)}
                style={{ width: '100%' }}
              >
                {returnReasons.map((reason) => (
                  <Option key={reason.key} value={reason.key}>
                    {reason.text}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Voucher Modal */}
        <GetVoucher
          visible={isVoucherModalVisible}
          onClose={() => setIsVoucherModalVisible(false)}
        />

        {/* Voucher with Coin Modal */}
        <GetVoucherWithCoin
          visible={isVoucherWithCoinModalVisible}
          onClose={() => setIsVoucherWithCoinModalVisible(false)}
        />

        {/* Popup thông báo thu phí */}
        <Modal
          title={
            <div className='text-center text-lg font-bold text-red-600'>
              🚨 Thông Báo Quan Trọng 🚨
            </div>
          }
          open={isFeeNoticeVisible}
          onCancel={handleCloseFeeNotice}
          footer={[
            <Button
              key='close'
              onClick={handleCloseFeeNotice}
              className='bg-gray-500 text-white hover:bg-gray-600'
            >
              Tắt
            </Button>,
            <Button
              key='dismiss'
              type='primary'
              danger
              onClick={handleDismissFeeNoticePermanently}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              Tắt vĩnh viễn
            </Button>,
          ]}
          width={600}
          centered
          closable={false}
          maskClosable={false}
        >
          <div className='text-center space-y-4'>
            <div className='flex justify-center'>
              <img src={Cuba} alt='Cuba' className='object-cover rounded-lg shadow-lg' />
            </div>

            <div className='text-gray-700 leading-relaxed'>
              <p className='text-lg font-medium mb-3'>
                Sau 1 khoảng thời gian dài web mình quyết định thu phí 10k/ người
              </p>
              <p className='text-base text-gray-600'>
                Hi vọng mọi người ủng hộ để web có thể duy trì và phát triển tốt hơn! 🙏
              </p>
            </div>

            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <p className='text-sm text-yellow-800'>
                💡 <strong>Lưu ý:</strong> Nút "Tắt vĩnh viễn" sẽ ẩn thông báo này mãi mãi. Nút
                "Tắt" chỉ ẩn lần này thôi.
              </p>
            </div>
          </div>
        </Modal>
      </div>

      {/* Footer */}
      <footer className='py-4 text-white bg-gray-800 w-full text-center'>
        © 2024 AutoPee. All rights reserved.
      </footer>
    </div>
  )
}

export default CheckMVDCookie
