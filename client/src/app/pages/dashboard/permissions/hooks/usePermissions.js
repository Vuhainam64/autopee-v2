import { useState, useEffect } from 'react'
import { message } from 'antd'
import { get, post, put, del } from '../../../../services/api.js'

export const usePermissions = () => {
  const [routes, setRoutes] = useState([])
  const [apis, setApis] = useState([])
  const [history, setHistory] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchRoles = async () => {
    try {
      const response = await get('/admin/roles')
      setRoles(response.data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await get('/admin/history')
      setHistory(response.data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
      message.error('Không thể tải lịch sử chỉnh sửa')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await get('/admin/routes')
      setRoutes(response.data || [])
    } catch (error) {
      console.error('Error fetching routes:', error)
      message.error('Không thể tải danh sách routes')
    } finally {
      setLoading(false)
    }
  }

  const fetchApis = async () => {
    try {
      setLoading(true)
      const response = await get('/admin/apis')
      setApis(response.data || [])
    } catch (error) {
      console.error('Error fetching APIs:', error)
      message.error('Không thể tải danh sách APIs')
    } finally {
      setLoading(false)
    }
  }

  const createRoute = async (values) => {
    await post('/admin/routes', values)
    message.success('Tạo route thành công')
    await fetchRoutes()
    await fetchHistory()
  }

  const updateRoute = async (id, values) => {
    await put(`/admin/routes/${id}`, values)
    message.success('Cập nhật route thành công')
    await fetchRoutes()
    await fetchHistory()
  }

  const deleteRoute = async (id) => {
    await del(`/admin/routes/${id}`)
    message.success('Xóa route thành công')
    await fetchRoutes()
    await fetchHistory()
  }

  const createApi = async (values) => {
    await post('/admin/apis', values)
    message.success('Tạo API thành công')
    await fetchApis()
    await fetchHistory()
  }

  const updateApi = async (id, values) => {
    await put(`/admin/apis/${id}`, values)
    message.success('Cập nhật API thành công')
    await fetchApis()
    await fetchHistory()
  }

  const deleteApi = async (id) => {
    await del(`/admin/apis/${id}`)
    message.success('Xóa API thành công')
    await fetchApis()
    await fetchHistory()
  }

  const bulkUpdateRoutes = async (ids, allowedRoles) => {
    await put('/admin/routes/bulk', { ids, allowedRoles })
    message.success(`Đã cập nhật ${ids.length} routes`)
    await fetchRoutes()
    await fetchHistory()
  }

  const bulkUpdateApis = async (ids, allowedRoles) => {
    await put('/admin/apis/bulk', { ids, allowedRoles })
    message.success(`Đã cập nhật ${ids.length} APIs`)
    await fetchApis()
    await fetchHistory()
  }

  const bulkCreateRoutes = async (routesData) => {
    const results = { success: 0, failed: 0, skipped: 0 }
    const errors = []

    for (const route of routesData) {
      try {
        await post('/admin/routes', route)
        results.success++
      } catch (error) {
        // Check if route already exists (duplicate key error)
        const errorMessage = error?.message || String(error) || ''
        const isDuplicate = 
          errorMessage.toLowerCase().includes('duplicate') ||
          errorMessage.toLowerCase().includes('e11000') ||
          errorMessage.toLowerCase().includes('unique') ||
          errorMessage.toLowerCase().includes('already exists')
        
        if (isDuplicate) {
          results.skipped++
        } else {
          results.failed++
          errors.push(`${route.path}: ${errorMessage || 'Lỗi không xác định'}`)
        }
      }
    }

    await fetchRoutes()
    await fetchHistory()

    if (results.failed > 0) {
      message.warning(
        `Đã thêm ${results.success} routes, bỏ qua ${results.skipped} routes trùng lặp, thất bại ${results.failed} routes`
      )
      if (errors.length > 0) {
        console.error('Import errors:', errors)
      }
    } else {
      message.success(
        `Đã thêm ${results.success} routes${results.skipped > 0 ? `, bỏ qua ${results.skipped} routes trùng lặp` : ''}`
      )
    }

    return results
  }

  const bulkCreateApis = async (apisData) => {
    const results = { success: 0, failed: 0, skipped: 0 }
    const errors = []

    for (const api of apisData) {
      try {
        await post('/admin/apis', api)
        results.success++
      } catch (error) {
        // Check if API already exists (duplicate key error)
        const errorMessage = error?.message || String(error) || ''
        const isDuplicate = 
          errorMessage.toLowerCase().includes('duplicate') ||
          errorMessage.toLowerCase().includes('e11000') ||
          errorMessage.toLowerCase().includes('unique') ||
          errorMessage.toLowerCase().includes('already exists')
        
        if (isDuplicate) {
          results.skipped++
        } else {
          results.failed++
          errors.push(`${api.endpoint}: ${errorMessage || 'Lỗi không xác định'}`)
        }
      }
    }

    await fetchApis()
    await fetchHistory()

    if (results.failed > 0) {
      message.warning(
        `Đã thêm ${results.success} APIs, bỏ qua ${results.skipped} APIs trùng lặp, thất bại ${results.failed} APIs`
      )
      if (errors.length > 0) {
        console.error('Import errors:', errors)
      }
    } else {
      message.success(
        `Đã thêm ${results.success} APIs${results.skipped > 0 ? `, bỏ qua ${results.skipped} APIs trùng lặp` : ''}`
      )
    }

    return results
  }

  useEffect(() => {
    fetchRoutes()
    fetchApis()
    fetchHistory()
    fetchRoles()
  }, [])

  return {
    routes,
    apis,
    history,
    roles,
    loading,
    fetchRoutes,
    fetchApis,
    fetchHistory,
    fetchRoles,
    createRoute,
    updateRoute,
    deleteRoute,
    createApi,
    updateApi,
    deleteApi,
    bulkUpdateRoutes,
    bulkUpdateApis,
    bulkCreateRoutes,
    bulkCreateApis,
  }
}

