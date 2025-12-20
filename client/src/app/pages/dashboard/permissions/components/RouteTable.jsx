import { useState, useMemo, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Input, AutoComplete } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EditFilled, ImportOutlined } from '@ant-design/icons'
import { sortRoles, generateRoutePatternOptions, filterRoutes } from '../utils/permissions.js'

export default function RouteTable({
  routes,
  roles,
  loading,
  onEdit,
  onDelete,
  onAdd,
  onBulkEdit,
  onImportJson,
  selectedKeys,
  onSelectionChange,
}) {
  const [searchText, setSearchText] = useState('')
  const [patternFilter, setPatternFilter] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState(selectedKeys || [])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  const routePatternOptions = useMemo(
    () => generateRoutePatternOptions(routes),
    [routes]
  )

  const filteredRoutes = useMemo(
    () => filterRoutes(routes, searchText, patternFilter),
    [routes, searchText, patternFilter]
  )

  // Reset pagination khi filter thay đổi
  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }, [searchText, patternFilter])

  const handleSelectByPattern = () => {
    if (!patternFilter) {
      return
    }
    const pattern = patternFilter.toLowerCase()
    const matching = filteredRoutes
      .filter((route) => route.path?.toLowerCase().startsWith(pattern))
      .map((r) => r._id)
    const newKeys = matching
    setSelectedRowKeys(newKeys)
    onSelectionChange?.(newKeys)
  }

  const routeColumns = [
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method) => {
        const methodColors = {
          GET: 'blue',
          POST: 'green',
          PUT: 'orange',
          DELETE: 'red',
          PATCH: 'purple',
        }
        const methodColor = methodColors[method] || 'default'
        return <Tag color={methodColor}>{method || 'GET'}</Tag>
      },
    },
    {
      title: 'Quyền truy cập',
      dataIndex: 'allowedRoles',
      key: 'allowedRoles',
      width: 200,
      align: 'right',
      render: (roleNames) => {
        const sortedRoles = sortRoles(roleNames, roles)
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '4px' }}>
            {sortedRoles.map((roleName) => {
              const roleData = roles.find((r) => r.name === roleName)
              return (
                <Tag key={roleName} color={roleData?.color || 'default'}>
                  {roleData?.displayName || roleName}
                </Tag>
              )
            })}
          </div>
        )
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: {
        showTitle: true,
      },
      render: (text) => text || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            size="small"
          >
            <span className="hidden sm:inline">Sửa</span>
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record._id)}
            size="small"
          >
            <span className="hidden sm:inline">Xóa</span>
          </Button>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => {
      setSelectedRowKeys(keys)
      onSelectionChange?.(keys)
    },
  }

  return (
    <Card
      extra={
        <Space>
          <Input
            placeholder="Tìm kiếm routes..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <AutoComplete
            placeholder="Pattern (vd: /product)"
            value={patternFilter}
            onChange={(value) => setPatternFilter(value)}
            options={routePatternOptions}
            allowClear
            style={{ width: 200 }}
            filterOption={(inputValue, option) =>
              option?.value?.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
          <Button
            onClick={handleSelectByPattern}
            disabled={!patternFilter}
          >
            Chọn theo pattern
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              icon={<EditFilled />}
              onClick={() => onBulkEdit(selectedRowKeys)}
            >
              Sửa hàng loạt ({selectedRowKeys.length})
            </Button>
          )}
          <Button
            icon={<ImportOutlined />}
            onClick={onImportJson}
          >
            Import JSON
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            Thêm Route
          </Button>
        </Space>
      }
    >
      <div className="overflow-x-auto">
          <Table
            columns={routeColumns}
            dataSource={filteredRoutes}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              pageSizeOptions: ['10', '20', '50', '100'],
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} routes`,
              responsive: true,
              onChange: (page, pageSize) => {
                setPagination({
                  current: page,
                  pageSize: pageSize || pagination.pageSize,
                })
              },
              onShowSizeChange: (current, size) => {
                setPagination({
                  current: 1,
                  pageSize: size,
                })
              },
            }}
            size="small"
            scroll={{ x: 'max-content' }}
            rowSelection={rowSelection}
          />
      </div>
    </Card>
  )
}

