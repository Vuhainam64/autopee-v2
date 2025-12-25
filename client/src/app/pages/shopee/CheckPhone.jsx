import { Tabs } from 'antd'
import ManualCheckTab from './components/ManualCheckTab.jsx'
import ServiceCheckTabs from './components/ServiceCheckTabs.jsx'

export default function CheckPhone() {
  return (
    <Tabs
      items={[
        {
          key: 'manual',
          label: 'Check số',
          children: <ManualCheckTab />,
        },
        {
          key: 'service',
          label: 'Check số qua dịch vụ',
          children: <ServiceCheckTabs />,
        },
      ]}
    />
  )
}
