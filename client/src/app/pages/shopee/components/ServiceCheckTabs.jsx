import { Tabs } from 'antd'
import ViotpServiceTab from './ViotpServiceTab.jsx'

export default function ServiceCheckTabs() {
  return (
    <Tabs
      items={[
        {
          key: 'viotp',
          label: 'Viotp',
          children: <ViotpServiceTab />,
        },
        {
          key: 'chaycodeso3',
          label: 'Chaycodeso3',
          children: <div style={{ padding: 16 }}>Coming soon</div>,
        },
        {
          key: 'bossotp',
          label: 'BossOTP',
          children: <div style={{ padding: 16 }}>Coming soon</div>,
        },
        {
          key: 'simotp',
          label: 'SimOTP',
          children: <div style={{ padding: 16 }}>Coming soon</div>,
        },
      ]}
    />
  )
}

