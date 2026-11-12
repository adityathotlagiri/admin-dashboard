import { useMemo, useState } from 'react'
import PageHeader from '../../../Components/ui/PageHeader'
import Tabs from '../../../Components/ui/Tabs'
import DateRangeFilter from '../../../Components/reports/DateRangeFilter'
import CoursesReportTab from '../../../Components/reports/CoursesReportTab'
import GrowthTab from '../../../Components/reports/GrowthTab'
import RevenueReportTab from '../../../Components/reports/RevenueReportTab'
import UsersReportTab from '../../../Components/reports/UsersReportTab'
import { rangeSummary } from '../../../Components/reports/reportHelpers'
import { getPresetRange, type RangePreset } from '../../../utils/dateRange'

type TabKey = 'growth' | 'users' | 'courses' | 'revenue'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'growth', label: 'Platform Growth' },
  { key: 'users', label: 'User Registrations' },
  { key: 'courses', label: 'Courses & Enrollment' },
  { key: 'revenue', label: 'Revenue' },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('growth')
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customFrom, setCustomFrom] = useState(() => getPresetRange('30d').from)
  const [customTo, setCustomTo] = useState(() => getPresetRange('30d').to)

  const range = useMemo(
    () => (preset === 'custom' ? { from: customFrom, to: customTo } : getPresetRange(preset)),
    [preset, customFrom, customTo],
  )

  let rangeError = ''
  if (preset === 'custom') {
    if (!customFrom || !customTo) rangeError = 'Choose both a start and an end date.'
    else if (customFrom > customTo) rangeError = 'The start date must be before the end date.'
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Analyze platform growth and export reports as PDF or Excel."
      />

      <div className="mb-6">
        <DateRangeFilter
          preset={preset}
          from={customFrom}
          to={customTo}
          onPresetChange={setPreset}
          onFromChange={setCustomFrom}
          onToChange={setCustomTo}
        />
        {rangeError ? (
          <p className="mt-2 text-sm text-red-600">{rangeError}</p>
        ) : (
          <p className="mt-2 text-xs text-gray-400">Showing data for {rangeSummary(range)}</p>
        )}
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {!rangeError && (
        <>
          {activeTab === 'growth' && <GrowthTab range={range} />}
          {activeTab === 'users' && <UsersReportTab range={range} />}
          {activeTab === 'courses' && <CoursesReportTab range={range} />}
          {activeTab === 'revenue' && <RevenueReportTab range={range} />}
        </>
      )}
    </div>
  )
}