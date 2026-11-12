import type { Paginated } from '../types'
import type {
  ActivityStats,
  CoursePerformanceRow,
  DateRange,
  EnrollmentReport,
  Granularity,
  GrowthRow,
  PerformanceQuery,
  RevenueReport,
  UserReport,
  WeekdayPoint,
} from '../types/reports'
import { parseInputDate, toInputDate } from '../utils/dateRange'
import { delay } from './delay'

/* ---------- Mock daily dataset (start of 2 years ago → today) ---------- */

interface DailyRecord {
  date: string
  weekday: number
  newStudents: number
  newTeachers: number
  enrollments: number
  revenue: number
  newSubscriptions: number
  cancelledSubscriptions: number
  activeUsers: number
}

type NumericKey = Exclude<keyof DailyRecord, 'date'>

const DAY = 24 * 60 * 60 * 1000

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function buildDaily(): DailyRecord[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(now.getFullYear() - 2, 0, 1)
  const totalDays = Math.round((today.getTime() - start.getTime()) / DAY) + 1

  return Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const growth = 1 + (i / totalDays) * 1.4
    const weekFactor = isWeekend ? 0.75 : 1.05

    return {
      date: toInputDate(date),
      weekday: date.getDay(),
      newStudents: Math.round((14 + seeded(i, 1) * 12) * growth * weekFactor),
      newTeachers: Math.round((1 + seeded(i, 2) * 2) * growth * weekFactor),
      enrollments: Math.round((35 + seeded(i, 3) * 30) * growth * weekFactor),
      revenue: Math.round((220 + seeded(i, 4) * 160) * growth * weekFactor),
      newSubscriptions: Math.round((4 + seeded(i, 5) * 6) * growth * weekFactor),
      cancelledSubscriptions: Math.round((1 + seeded(i, 6) * 3) * growth * weekFactor),
      activeUsers: Math.round((850 + seeded(i, 7) * 250) * growth * (isWeekend ? 0.8 : 1.05)),
    }
  })
}

const daily = buildDaily()

function inRange(range: DateRange) {
  return daily.filter((r) => r.date >= range.from && r.date <= range.to)
}

function sum(records: DailyRecord[], key: NumericKey) {
  return records.reduce((total, r) => total + r[key], 0)
}

/* ---------- Bucketing ---------- */

type BucketMode = 'day' | 'week' | 'month' | 'year'

interface Bucket {
  key: string
  label: string
  newStudents: number
  newTeachers: number
  enrollments: number
  revenue: number
  newSubscriptions: number
  cancelledSubscriptions: number
}

function pickMode(days: number): BucketMode {
  if (days <= 31) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}

function keyFor(dateStr: string, mode: BucketMode) {
  if (mode === 'day') return dateStr
  if (mode === 'month') return dateStr.slice(0, 7)
  if (mode === 'year') return dateStr.slice(0, 4)

  const date = parseInputDate(dateStr)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return toInputDate(date)
}

function labelFor(dateStr: string, mode: BucketMode) {
  const date = parseInputDate(dateStr)
  if (mode === 'year') return String(date.getFullYear())
  if (mode === 'month') {
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function bucketize(records: DailyRecord[], mode: BucketMode): Bucket[] {
  const buckets = new Map<string, Bucket>()

  for (const record of records) {
    const key = keyFor(record.date, mode)
    let bucket = buckets.get(key)

    if (!bucket) {
      bucket = {
        key,
        label: mode === 'week' ? labelFor(key, mode) : labelFor(record.date, mode),
        newStudents: 0,
        newTeachers: 0,
        enrollments: 0,
        revenue: 0,
        newSubscriptions: 0,
        cancelledSubscriptions: 0,
      }
      buckets.set(key, bucket)
    }

    bucket.newStudents += record.newStudents
    bucket.newTeachers += record.newTeachers
    bucket.enrollments += record.enrollments
    bucket.revenue += record.revenue
    bucket.newSubscriptions += record.newSubscriptions
    bucket.cancelledSubscriptions += record.cancelledSubscriptions
  }

  return [...buckets.values()]
}

/* ---------- Platform growth ---------- */

export async function getGrowthReport(
  range: DateRange,
  granularity: Granularity,
): Promise<GrowthRow[]> {
  await delay(500)

  const mode: BucketMode = granularity === 'yearly' ? 'year' : 'month'
  const buckets = bucketize(inRange(range), mode)
  const currentKey = keyFor(toInputDate(new Date()), mode)

  return buckets.map((bucket, i) => {
    const previous = buckets[i - 1]
    const revenueGrowth =
      previous && previous.revenue > 0
        ? Number((((bucket.revenue - previous.revenue) / previous.revenue) * 100).toFixed(1))
        : null

    return {
      key: bucket.key,
      period: bucket.key === currentKey ? `${bucket.label} (so far)` : bucket.label,
      newUsers: bucket.newStudents + bucket.newTeachers,
      enrollments: bucket.enrollments,
      revenue: bucket.revenue,
      revenueGrowth,
    }
  })
}

/* ---------- Users ---------- */

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_INDEXES = [1, 2, 3, 4, 5, 6, 0]

export async function getUserReport(range: DateRange): Promise<UserReport> {
  await delay(500)

  const records = inRange(range)
  const days = Math.max(1, records.length)
  const buckets = bucketize(records, pickMode(records.length))

  const students = sum(records, 'newStudents')
  const teachers = sum(records, 'newTeachers')

  const dau = Math.round(sum(records, 'activeUsers') / days)
  const mau = Math.round(dau * 5.4)
  const activity: ActivityStats = {
    dau,
    wau: Math.round(dau * 2.6),
    mau,
    avgSessionMin: 22 + (records.length % 7),
    stickiness: mau > 0 ? Number(((dau / mau) * 100).toFixed(1)) : 0,
  }

  const weekday: WeekdayPoint[] = WEEKDAY_INDEXES.map((dayIndex, i) => {
    const subset = records.filter((r) => r.weekday === dayIndex)
    return {
      day: WEEKDAY_LABELS[i],
      activeUsers: subset.length ? Math.round(sum(subset, 'activeUsers') / subset.length) : 0,
    }
  })

  return {
    totalRegistrations: students + teachers,
    students,
    teachers,
    avgPerDay: Number(((students + teachers) / days).toFixed(1)),
    trend: buckets.map((b) => ({
      period: b.label,
      students: b.newStudents,
      teachers: b.newTeachers,
      total: b.newStudents + b.newTeachers,
    })),
    activity,
    weekday,
  }
}

/* ---------- Courses ---------- */

interface CatalogCourse {
  id: string
  title: string
  category: string
  weight: number
  completionRate: number
  avgRating: number
  avgScore: number
}

const courseCatalog: CatalogCourse[] = [
  { id: 'rc-1', title: 'Python Fundamentals', category: 'Programming', weight: 0.16, completionRate: 78, avgRating: 4.7, avgScore: 82 },
  { id: 'rc-2', title: 'JavaScript Essentials', category: 'Programming', weight: 0.13, completionRate: 72, avgRating: 4.6, avgScore: 79 },
  { id: 'rc-3', title: 'Web Development Bootcamp', category: 'Programming', weight: 0.11, completionRate: 61, avgRating: 4.5, avgScore: 76 },
  { id: 'rc-4', title: 'Machine Learning Intro', category: 'Data & AI', weight: 0.1, completionRate: 58, avgRating: 4.8, avgScore: 74 },
  { id: 'rc-5', title: 'Algebra Basics', category: 'Mathematics', weight: 0.09, completionRate: 84, avgRating: 4.4, avgScore: 85 },
  { id: 'rc-6', title: 'Calculus I', category: 'Mathematics', weight: 0.08, completionRate: 55, avgRating: 4.2, avgScore: 69 },
  { id: 'rc-7', title: 'English Communication', category: 'Languages', weight: 0.07, completionRate: 80, avgRating: 4.5, avgScore: 83 },
  { id: 'rc-8', title: 'Physics 101', category: 'Science', weight: 0.06, completionRate: 63, avgRating: 4.3, avgScore: 71 },
  { id: 'rc-9', title: 'Spanish for Beginners', category: 'Languages', weight: 0.06, completionRate: 74, avgRating: 4.6, avgScore: 80 },
  { id: 'rc-10', title: 'Statistics for Beginners', category: 'Mathematics', weight: 0.05, completionRate: 66, avgRating: 4.1, avgScore: 72 },
  { id: 'rc-11', title: 'Biology Foundations', category: 'Science', weight: 0.05, completionRate: 70, avgRating: 4.4, avgScore: 77 },
  { id: 'rc-12', title: 'Organic Chemistry', category: 'Science', weight: 0.04, completionRate: 49, avgRating: 3.9, avgScore: 64 },
]

export async function getEnrollmentReport(range: DateRange): Promise<EnrollmentReport> {
  await delay(500)

  const records = inRange(range)
  const days = Math.max(1, records.length)
  const total = sum(records, 'enrollments')
  const buckets = bucketize(records, pickMode(records.length))

  const topCourses = courseCatalog
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      enrollments: Math.round(total * c.weight),
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 8)

  return {
    totalEnrollments: total,
    avgPerDay: Number((total / days).toFixed(1)),
    topCourse: total > 0 ? topCourses[0].title : '—',
    trackedCourses: courseCatalog.length,
    trend: buckets.map((b) => ({ period: b.label, enrollments: b.enrollments })),
    topCourses,
  }
}

export async function getCoursePerformance(
  query: PerformanceQuery,
): Promise<Paginated<CoursePerformanceRow>> {
  await delay(400)

  const total = sum(inRange(query.range), 'enrollments')

  const rows: CoursePerformanceRow[] = courseCatalog.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    enrollments: Math.round(total * c.weight),
    completionRate: c.completionRate,
    avgRating: c.avgRating,
    avgScore: c.avgScore,
  }))

  const sorted = [...rows].sort((a, b) => {
    const left = a[query.sortBy]
    const right = b[query.sortBy]
    const cmp =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right))
    return query.sortDir === 'asc' ? cmp : -cmp
  })

  const start = (query.page - 1) * query.pageSize

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  }
}

/* ---------- Revenue ---------- */

const planShares: { plan: string; share: number }[] = [
  { plan: 'Basic', share: 0.18 },
  { plan: 'Pro', share: 0.37 },
  { plan: 'Premium', share: 0.27 },
  { plan: 'Pro Annual', share: 0.18 },
]

export async function getRevenueReport(range: DateRange): Promise<RevenueReport> {
  await delay(500)

  const records = inRange(range)
  const buckets = bucketize(records, pickMode(records.length))

  const totalRevenue = sum(records, 'revenue')
  const newSubscriptions = sum(records, 'newSubscriptions')
  const cancelled = sum(records, 'cancelledSubscriptions')

  let allocated = 0
  const byPlan = planShares.map((item, index) => {
    const revenue =
      index === planShares.length - 1
        ? totalRevenue - allocated
        : Math.round(totalRevenue * item.share)
    allocated += revenue
    return { plan: item.plan, revenue }
  })

  return {
    totalRevenue,
    newSubscriptions,
    cancelled,
    netSubscribers: newSubscriptions - cancelled,
    trend: buckets.map((b) => ({
      period: b.label,
      revenue: b.revenue,
      newSubscriptions: b.newSubscriptions,
      cancelled: b.cancelledSubscriptions,
      net: b.newSubscriptions - b.cancelledSubscriptions,
    })),
    byPlan,
  }
}