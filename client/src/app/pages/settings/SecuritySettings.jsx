import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, App, Tag, Popconfirm, Space, Spin } from 'antd'
import { 
  SecurityScanOutlined, 
  LogoutOutlined, 
  DeleteOutlined,
  ReloadOutlined 
} from '@ant-design/icons'
import { getUserSessions, revokeSession, revokeAllOtherSessions } from '../../services/authApi.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

function SecuritySettings() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const { currentUser, logout } = useAuth()
  const { message: messageApi } = App.useApp()
  const navigate = useNavigate()

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await getUserSessions()
      if (response.success && response.data) {
        // Get current token to identify current session
        let currentTokenId = null
        try {
          const { auth } = await import('../../config/firebase.js')
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken()
            // Decode token to get issued time (iat) as session identifier
            const tokenParts = token.split('.')
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]))
              currentTokenId = payload.iat?.toString()
            }
          }
        } catch (tokenError) {
          console.warn('Failed to get current token:', tokenError)
        }

        // Mark current session (compare sessionId with token iat)
        const sessionsWithCurrent = response.data.map(session => ({
          ...session,
          isCurrent: currentTokenId && session.sessionId === currentTokenId,
        }))
        
        // Remove duplicates (same sessionId) - keep the most recent one
        const uniqueSessions = []
        const seenSessionIds = new Set()
        sessionsWithCurrent
          .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
          .forEach(session => {
            if (!seenSessionIds.has(session.sessionId)) {
              seenSessionIds.add(session.sessionId)
              uniqueSessions.push(session)
            }
          })
        
        setSessions(uniqueSessions)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
      messageApi.error('Không thể tải danh sách phiên đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadSessions()
    } else {
      // If user is logged out, redirect to home
      navigate('/')
    }
  }, [currentUser, navigate])

  const handleRevokeSession = async (sessionId) => {
    try {
      setRevoking(true)
      
      // Check if this is the current session before revoking
      let isCurrentSession = false
      try {
        const { auth } = await import('../../config/firebase.js')
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken()
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            const currentTokenId = payload.iat?.toString()
            isCurrentSession = currentTokenId === sessionId
          }
        }
      } catch (tokenError) {
        console.warn('Failed to check current session:', tokenError)
      }

      const response = await revokeSession(sessionId)
      if (response.success) {
        if (isCurrentSession) {
          // If revoking current session, logout and redirect
          await logout()
          messageApi.success('Đã đăng xuất')
          navigate('/')
        } else {
          messageApi.success('Đã đăng xuất thiết bị này')
          await loadSessions()
        }
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
      messageApi.error('Không thể đăng xuất thiết bị')
    } finally {
      setRevoking(false)
    }
  }

  const handleRevokeAllOthers = async () => {
    try {
      setRevoking(true)
      const response = await revokeAllOtherSessions()
      if (response.success) {
        messageApi.success('Đã đăng xuất tất cả thiết bị khác')
        await loadSessions()
      }
    } catch (error) {
      console.error('Failed to revoke all sessions:', error)
      messageApi.error('Không thể đăng xuất các thiết bị khác')
    } finally {
      setRevoking(false)
    }
  }

  const handleLogoutAll = async () => {
    try {
      setRevoking(true)
      // Revoke all other sessions first
      await revokeAllOtherSessions()
      // Then logout from current device (this will revoke current session too)
      await logout()
      messageApi.success('Đã đăng xuất tất cả thiết bị')
      // Redirect to home page
      navigate('/')
    } catch (error) {
      console.error('Failed to logout all:', error)
      messageApi.error('Không thể đăng xuất tất cả thiết bị')
    } finally {
      setRevoking(false)
    }
  }

  const formatIP = (ip) => {
    if (!ip || ip === 'Unknown') return ip
    // Format IPv6 - can be shortened for display
    if (ip.includes(':')) {
      // IPv6 format - keep as is or can be shortened
      return ip
    }
    return ip
  }

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Không xác định'
    
    // Detect device type
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPhone/.test(userAgent)) return 'iPhone'
      if (/iPad/.test(userAgent)) return 'iPad'
      if (/Android/.test(userAgent)) return 'Android'
      return 'Mobile'
    }
    
    // Detect browser
    if (/Chrome/.test(userAgent)) return 'Chrome'
    if (/Firefox/.test(userAgent)) return 'Firefox'
    if (/Safari/.test(userAgent)) return 'Safari'
    if (/Edge/.test(userAgent)) return 'Edge'
    
    return 'Desktop'
  }

  const columns = [
    {
      title: 'Thiết bị',
      dataIndex: 'userAgent',
      key: 'device',
      render: (userAgent) => (
        <div>
          <div className="font-medium">{getDeviceInfo(userAgent)}</div>
          <div className="text-xs text-slate-500 mt-1">
            {userAgent?.substring(0, 60)}...
          </div>
        </div>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => {
        const formattedIP = formatIP(ip)
        return (
          <Tag color="blue" title={formattedIP}>
            {formattedIP || 'Unknown'}
          </Tag>
        )
      },
    },
    {
      title: 'Hoạt động lần cuối',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY HH:mm')}</div>
          <div className="text-xs text-slate-500">
            {dayjs(date).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        const isCurrent = record.isCurrent
        return (
          <Space>
            {isCurrent ? (
              <Tag color="green">Thiết bị hiện tại</Tag>
            ) : (
              <Popconfirm
                title="Đăng xuất thiết bị này?"
                description="Bạn có chắc muốn đăng xuất thiết bị này không?"
                onConfirm={() => handleRevokeSession(record.sessionId)}
                okText="Đăng xuất"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={revoking}
                >
                  Đăng xuất
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <SecurityScanOutlined />
              Bảo mật & Phiên đăng nhập
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSessions}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <div className="mb-4 flex gap-2">
          <Popconfirm
            title="Đăng xuất tất cả thiết bị khác?"
            description="Bạn sẽ vẫn đăng nhập trên thiết bị hiện tại. Các thiết bị khác sẽ bị đăng xuất."
            onConfirm={handleRevokeAllOthers}
            okText="Đăng xuất"
            cancelText="Hủy"
          >
            <Button
              icon={<LogoutOutlined />}
              loading={revoking}
            >
              Đăng xuất tất cả thiết bị khác
            </Button>
          </Popconfirm>
          
          <Popconfirm
            title="Đăng xuất tất cả thiết bị?"
            description="Bạn sẽ bị đăng xuất khỏi tất cả thiết bị, bao gồm cả thiết bị hiện tại."
            onConfirm={handleLogoutAll}
            okText="Đăng xuất tất cả"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<LogoutOutlined />}
              loading={revoking}
            >
              Đăng xuất tất cả
            </Button>
          </Popconfirm>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={sessions}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} phiên đăng nhập`,
            }}
            locale={{
              emptyText: 'Không có phiên đăng nhập nào',
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default SecuritySettings

