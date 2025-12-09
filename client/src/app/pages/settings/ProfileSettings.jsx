import { useState, useEffect } from 'react'
import { Form, Input, Button, DatePicker, Select, Card, App, Spin } from 'antd'
import { UserOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useAppSelector, useAppDispatch } from '../../store/hooks.js'
import { setUser } from '../../store/slices/userSlice.js'
import { getCurrentUser, updateUserProfile } from '../../services/authApi.js'
import dayjs from 'dayjs'

const { Option } = Select

function ProfileSettings() {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { currentUser } = useAuth()
  const userProfile = useAppSelector((state) => state.user.currentUser)
  const dispatch = useAppDispatch()
  const { message: messageApi } = App.useApp()

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setIsFetching(false)
        return
      }

      try {
        setIsFetching(true)
        // Fetch from API to get latest data
        const response = await getCurrentUser()
        
        if (response.success && response.data) {
          // Update Redux store
          dispatch(setUser({
            ...response.data,
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
          }))

          // Set form values
          form.setFieldsValue({
            email: currentUser.email || '',
            displayName: response.data.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || '',
            phone: response.data.phone || '',
            dateOfBirth: response.data.dateOfBirth ? dayjs(response.data.dateOfBirth) : null,
            gender: response.data.gender || '',
          })
        } else {
          // Fallback to current user data
          form.setFieldsValue({
            email: currentUser.email || '',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
            phone: '',
            dateOfBirth: null,
            gender: '',
          })
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        // Fallback to current user data
        form.setFieldsValue({
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
          phone: '',
          dateOfBirth: null,
          gender: '',
        })
      } finally {
        setIsFetching(false)
      }
    }

    loadProfile()
  }, [currentUser, dispatch, form])

  // Also update form when Redux store updates (for real-time updates)
  useEffect(() => {
    if (userProfile && !isFetching) {
      form.setFieldsValue({
        email: currentUser?.email || userProfile.email || '',
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        dateOfBirth: userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth) : null,
        gender: userProfile.gender || '',
      })
    }
  }, [userProfile, currentUser, form, isFetching])

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true)
      // Only include fields that have values (allow partial updates)
      const profileData = {}
      
      if (values.displayName !== undefined && values.displayName !== null && values.displayName.trim() !== '') {
        profileData.displayName = values.displayName.trim()
      }
      
      if (values.phone !== undefined && values.phone !== null && values.phone.trim() !== '') {
        profileData.phone = values.phone.trim()
      } else if (values.phone !== undefined) {
        // Explicitly set to null to clear the field
        profileData.phone = null
      }
      
      if (values.dateOfBirth !== undefined) {
        profileData.dateOfBirth = values.dateOfBirth ? values.dateOfBirth.toISOString() : null
      }
      
      if (values.gender !== undefined) {
        profileData.gender = values.gender || null
      }

      const response = await updateUserProfile(profileData)
      
      if (response.success && response.data) {
        // Update Redux store
        dispatch(setUser({
          ...userProfile,
          ...response.data,
        }))
        messageApi.success('Cập nhật profile thành công!')
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      const errorMessage = error.response?.data?.error?.message || error.message || 'Cập nhật profile thất bại. Vui lòng thử lại.'
      messageApi.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý thông tin cá nhân của bạn
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6"
        >
          <Form.Item
            label="Email"
            name="email"
          >
            <Input
              prefix={<UserOutlined className="text-slate-400" />}
              size="large"
              disabled
              className="bg-slate-50"
            />
          </Form.Item>

          <Form.Item
            label="Họ và tên"
            name="displayName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên!' },
              { max: 100, message: 'Họ và tên không được quá 100 ký tự!' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-400" />}
              placeholder="Nhập họ và tên"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              {
                pattern: /^[0-9]{10,11}$/,
                message: 'Số điện thoại không hợp lệ!',
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-slate-400" />}
              placeholder="Nhập số điện thoại"
              size="large"
              maxLength={11}
            />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="Ngày sinh"
              name="dateOfBirth"
            >
              <DatePicker
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                disabledDate={(current) => {
                  return current && current > dayjs().endOf('day')
                }}
              />
            </Form.Item>

            <Form.Item
              label="Giới tính"
              name="gender"
            >
              <Select
                size="large"
                placeholder="Chọn giới tính"
                allowClear
              >
                <Option value="male">Nam</Option>
                <Option value="female">Nữ</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              size="large"
              className="bg-orange-500 hover:bg-orange-600"
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ProfileSettings

