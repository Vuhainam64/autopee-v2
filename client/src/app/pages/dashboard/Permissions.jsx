import { useState } from 'react'
import { Tabs, Modal, Form, message } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { usePermissions } from './permissions/hooks/usePermissions.js'
import RouteTable from './permissions/components/RouteTable.jsx'
import ApiTable from './permissions/components/ApiTable.jsx'
import HistoryTable from './permissions/components/HistoryTable.jsx'
import RouteModal from './permissions/components/RouteModal.jsx'
import ApiModal from './permissions/components/ApiModal.jsx'
import BulkEditModal from './permissions/components/BulkEditModal.jsx'
import ImportJsonModal from './permissions/components/ImportJsonModal.jsx'

function Permissions() {
  const {
    routes,
    apis,
    history,
    roles,
    loading,
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
  } = usePermissions()

  const [routeModalVisible, setRouteModalVisible] = useState(false)
  const [apiModalVisible, setApiModalVisible] = useState(false)
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false)
  const [importJsonModalVisible, setImportJsonModalVisible] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [editingApi, setEditingApi] = useState(null)
  const [bulkEditType, setBulkEditType] = useState(null)
  const [importJsonType, setImportJsonType] = useState(null)
  const [selectedRouteKeys, setSelectedRouteKeys] = useState([])
  const [selectedApiKeys, setSelectedApiKeys] = useState([])

  const [routeForm] = Form.useForm()
  const [apiForm] = Form.useForm()
  const [bulkEditForm] = Form.useForm()
  const [importJsonForm] = Form.useForm()

  const handleRouteSubmit = async (values) => {
    try {
      if (editingRoute) {
        await updateRoute(editingRoute._id, values)
      } else {
        await createRoute(values)
      }
      setRouteModalVisible(false)
      routeForm.resetFields()
      setEditingRoute(null)
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleApiSubmit = async (values) => {
    try {
      if (editingApi) {
        await updateApi(editingApi._id, values)
      } else {
        await createApi(values)
      }
      setApiModalVisible(false)
      apiForm.resetFields()
      setEditingApi(null)
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleEditRoute = (route) => {
    setEditingRoute(route)
    routeForm.setFieldsValue({
      path: route.path,
      method: route.method || 'GET',
      allowedRoles: route.allowedRoles || [],
      description: route.description || '',
    })
    setRouteModalVisible(true)
  }

  const handleEditApi = (api) => {
    setEditingApi(api)
    apiForm.setFieldsValue({
      endpoint: api.endpoint,
      method: api.method || 'GET',
      allowedRoles: api.allowedRoles || [],
      description: api.description || '',
    })
    setApiModalVisible(true)
  }

  const handleDeleteRoute = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa route này?',
      onOk: async () => {
        try {
          await deleteRoute(id)
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa route')
        }
      },
    })
  }

  const handleDeleteApi = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa API này?',
      onOk: async () => {
        try {
          await deleteApi(id)
        } catch (error) {
          message.error('Có lỗi xảy ra khi xóa API')
        }
      },
    })
  }

  const handleBulkEdit = async (values) => {
    try {
      if (bulkEditType === 'routes') {
        await bulkUpdateRoutes(selectedRouteKeys, values.allowedRoles)
        setSelectedRouteKeys([])
      } else {
        await bulkUpdateApis(selectedApiKeys, values.allowedRoles)
        setSelectedApiKeys([])
      }
      setBulkEditModalVisible(false)
      bulkEditForm.resetFields()
      setBulkEditType(null)
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleImportJson = async (jsonData) => {
    try {
      if (importJsonType === 'routes') {
        await bulkCreateRoutes(jsonData)
      } else {
        await bulkCreateApis(jsonData)
      }
      setImportJsonModalVisible(false)
      importJsonForm.resetFields()
      setImportJsonType(null)
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const tabItems = [
    {
      key: 'routes',
      label: 'Routes',
      children: (
        <RouteTable
          routes={routes}
          roles={roles}
          loading={loading}
          onEdit={handleEditRoute}
          onDelete={handleDeleteRoute}
          onAdd={() => {
            setEditingRoute(null)
            routeForm.resetFields()
            setRouteModalVisible(true)
          }}
          onBulkEdit={() => {
            setBulkEditType('routes')
            setBulkEditModalVisible(true)
          }}
          onImportJson={() => {
            setImportJsonType('routes')
            importJsonForm.resetFields()
            setImportJsonModalVisible(true)
          }}
          selectedKeys={selectedRouteKeys}
          onSelectionChange={setSelectedRouteKeys}
        />
      ),
    },
    {
      key: 'apis',
      label: 'APIs',
      children: (
        <ApiTable
          apis={apis}
          roles={roles}
          loading={loading}
          onEdit={handleEditApi}
          onDelete={handleDeleteApi}
          onAdd={() => {
            setEditingApi(null)
            apiForm.resetFields()
            setApiModalVisible(true)
          }}
          onBulkEdit={() => {
            setBulkEditType('apis')
            setBulkEditModalVisible(true)
          }}
          onImportJson={() => {
            setImportJsonType('apis')
            importJsonForm.resetFields()
            setImportJsonModalVisible(true)
          }}
          selectedKeys={selectedApiKeys}
          onSelectionChange={setSelectedApiKeys}
        />
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Lịch sử chỉnh sửa
        </span>
      ),
      children: <HistoryTable history={history} loading={loading} />,
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý phân quyền</h1>
      </div>

      <Tabs
        items={tabItems}
        defaultActiveKey="routes"
        size="large"
        className="w-full"
      />

      <RouteModal
        visible={routeModalVisible}
        editingRoute={editingRoute}
        roles={roles}
        onCancel={() => {
          setRouteModalVisible(false)
          routeForm.resetFields()
          setEditingRoute(null)
        }}
        onSubmit={handleRouteSubmit}
        form={routeForm}
      />

      <ApiModal
        visible={apiModalVisible}
        editingApi={editingApi}
        roles={roles}
        onCancel={() => {
          setApiModalVisible(false)
          apiForm.resetFields()
          setEditingApi(null)
        }}
        onSubmit={handleApiSubmit}
        form={apiForm}
      />

      <BulkEditModal
        visible={bulkEditModalVisible}
        type={bulkEditType}
        count={bulkEditType === 'routes' ? selectedRouteKeys.length : selectedApiKeys.length}
        roles={roles}
        onCancel={() => {
          setBulkEditModalVisible(false)
          bulkEditForm.resetFields()
          setBulkEditType(null)
        }}
        onSubmit={handleBulkEdit}
        form={bulkEditForm}
      />

      <ImportJsonModal
        visible={importJsonModalVisible}
        type={importJsonType}
        onCancel={() => {
          setImportJsonModalVisible(false)
          importJsonForm.resetFields()
          setImportJsonType(null)
        }}
        onSubmit={handleImportJson}
        form={importJsonForm}
      />
    </div>
  )
}

export default Permissions
