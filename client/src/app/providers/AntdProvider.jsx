import { ConfigProvider, theme, App } from 'antd'

const tokens = {
  colorPrimary: '#ff5a2c',
  colorLink: '#ff5a2c',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
}

function AntdProvider({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: tokens,
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}

export default AntdProvider

