import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useInterval } from '../../../hooks/useInterval'
import { useResourceHistory } from '../../../hooks/useResourceHistory'
import Button from '../../../Components/ui/Button'
import PageHeader from '../../../Components/ui/PageHeader'
import Tabs from '../../../Components/ui/Tabs'
import AuditLogsTab from '../../../Components/monitoring/AuditLogsTab'
import ErrorsAlertsTab from '../../../Components/monitoring/ErrorsAlertsTab'
import OverviewTab from '../../../Components/monitoring/OverviewTab'

type TabKey = 'overview' | 'errors' | 'audit'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'errors', label: 'Errors & Alerts' },
  { key: 'audit', label: 'Audit Logs' },
]

const REFRESH_MS = 5000

export default function SystemMonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [tick, setTick] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const refresh = () => {
    setTick((t) => t + 1)
    setLastUpdated(new Date())
  }

  useInterval(refresh, autoRefresh ? REFRESH_MS : null)
  const history = useResourceHistory(tick)

  return (
    <div>
      <PageHeader
        title="System Monitoring"
        description="Track platform health, performance, errors, and admin activity."
        actions={
          <>
            <span className="hidden text-xs text-gray-400 sm:block">
              Updated {lastUpdated.toLocaleTimeString('en-GB')}
            </span>
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              Auto-refresh {autoRefresh ? 'on' : 'off'}
            </Button>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </>
        }
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab tick={tick} history={history} />}
      {activeTab === 'errors' && <ErrorsAlertsTab />}
      {activeTab === 'audit' && <AuditLogsTab />}
    </div>
  )
}