import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BookOpen, Crown, TrendingUp, Users } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { getCoursePerformance, getEnrollmentReport } from '../../data/reports'
import type {
  CoursePerformanceRow,
  DateRange,
  PerformanceSortKey,
} from '../../types/reports'
import type { ReportExport } from '../../utils/exportReport'
import { formatNumber } from '../../utils/format'
import DataTable, { type Column } from '../ui/DataTable'
import StatCard from '../ui/StatCard'
import { ErrorState, LoadingState } from '../ui/States'
import ChartCard from './ChartCard'
import ExportButtons from './ExportButtons'
import { describeRange } from './reportHelpers'

const PAGE_SIZE = 6

const columns: Column<CoursePerformanceRow>[] = [
  {
    key: 'title',
    header: 'Course',
    sortable: true,
    render: (r) => <span className="font-medium text-gray-900">{r.title}</span>,
  },
  {
    key: 'category',
    header: 'Category',
    sortable: true,
    render: (r) => <span className="text-gray-600">{r.category}</span>,
  },
  {
    key: 'enrollments',
    header: 'Enrollments',
    sortable: true,
    render: (r) => <span className="text-gray-700">{formatNumber(r.enrollments)}</span>,
  },
  {
    key: 'completionRate',
    header: 'Completion',
    sortable: true,
    render: (r) => <span className="text-gray-700">{r.completionRate}%</span>,
  },
  {
    key: 'avgRating',
    header: 'Avg rating',
    sortable: true,
    render: (r) => <span className="text-gray-700">★ {r.avgRating.toFixed(1)}</span>,
  },
  {
    key: 'avgScore',
    header: 'Avg score',
    sortable: true,
    render: (r) => <span className="text-gray-700">{r.avgScore}%</span>,
  },
]

export default function CoursesReportTab({ range }: { range: DateRange }) {
  const [sortBy, setSortBy] = useState<PerformanceSortKey>('enrollments')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const enrollment = useAsync(() => getEnrollmentReport(range), [range.from, range.to])
  const performance = useAsync(
    () => getCoursePerformance({ range, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [range.from, range.to, sortBy, sortDir, page],
  )

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as PerformanceSortKey)
      setSortDir(key === 'title' || key === 'category' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  const buildReport = async (): Promise<ReportExport | null> => {
    if (!enrollment.data) return null
    const all = await getCoursePerformance({
      range,
      sortBy,
      sortDir,
      page: 1,
      pageSize: 1000,
    })

    return {
      title: 'Course Enrollment & Performance Report',
      subtitle: describeRange(range),
      fileName: 'course-enrollment-performance',
      summary: [
        { label: 'Total enrollments', value: formatNumber(enrollment.data.totalEnrollments) },
        { label: 'Average per day', value: String(enrollment.data.avgPerDay) },
        { label: 'Top course', value: enrollment.data.topCourse },
        { label: 'Courses tracked', value: String(enrollment.data.trackedCourses) },
      ],
      headers: ['Course', 'Category', 'Enrollments', 'Completion (%)', 'Avg rating', 'Avg score (%)'],
      rows: all.items.map((r) => [
        r.title,
        r.category,
        r.enrollments,
        r.completionRate,
        r.avgRating,
        r.avgScore,
      ]),
    }
  }

  if (enrollment.error) return <ErrorState message={enrollment.error} onRetry={enrollment.reload} />
  if (!enrollment.data) return <LoadingState label="Building course report..." />

  const report = enrollment.data

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons getReport={buildReport} disabled={report.totalEnrollments === 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Enrollments" value={formatNumber(report.totalEnrollments)} icon={Users} />
        <StatCard label="Avg per Day" value={String(report.avgPerDay)} icon={TrendingUp} />
        <StatCard label="Top Course" value={report.topCourse} icon={Crown} />
        <StatCard label="Courses Tracked" value={String(report.trackedCourses)} icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Top courses by enrollment" subtitle="Most popular courses in this range">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.topCourses} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="enrollments" name="Enrollments" fill="#238B45" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Enrollment trend" subtitle="New enrollments over time">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  name="Enrollments"
                  stroke="#238B45"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-900">Course performance</h2>
        {performance.error ? (
          <ErrorState message={performance.error} onRetry={performance.reload} />
        ) : !performance.data ? (
          <LoadingState label="Loading course performance..." />
        ) : (
          <DataTable
            columns={columns}
            rows={performance.data.items}
            rowKey={(r) => r.id}
            total={performance.data.total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            loading={performance.loading}
            emptyTitle="No course data"
          />
        )}
      </div>
    </div>
  )
}