export interface DateRange {
  from: string
  to: string
}

/* ---------- Platform growth ---------- */

export type Granularity = 'monthly' | 'yearly'

export interface GrowthRow {
  key: string
  period: string
  newUsers: number
  enrollments: number
  revenue: number
  revenueGrowth: number | null
}

/* ---------- User registrations & activity ---------- */

export interface UserTrendPoint {
  period: string
  students: number
  teachers: number
  total: number
}

export interface ActivityStats {
  dau: number
  wau: number
  mau: number
  avgSessionMin: number
  stickiness: number
}

export interface WeekdayPoint {
  day: string
  activeUsers: number
}

export interface UserReport {
  totalRegistrations: number
  students: number
  teachers: number
  avgPerDay: number
  trend: UserTrendPoint[]
  activity: ActivityStats
  weekday: WeekdayPoint[]
}

/* ---------- Courses & enrollment ---------- */

export interface EnrollmentTrendPoint {
  period: string
  enrollments: number
}

export interface CourseEnrollment {
  id: string
  title: string
  category: string
  enrollments: number
}

export interface EnrollmentReport {
  totalEnrollments: number
  avgPerDay: number
  topCourse: string
  trackedCourses: number
  trend: EnrollmentTrendPoint[]
  topCourses: CourseEnrollment[]
}

export interface CoursePerformanceRow {
  id: string
  title: string
  category: string
  enrollments: number
  completionRate: number
  avgRating: number
  avgScore: number
}

export type PerformanceSortKey =
  | 'title'
  | 'category'
  | 'enrollments'
  | 'completionRate'
  | 'avgRating'
  | 'avgScore'

export interface PerformanceQuery {
  range: DateRange
  sortBy: PerformanceSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

/* ---------- Revenue ---------- */

export interface RevenueTrendPoint {
  period: string
  revenue: number
  newSubscriptions: number
  cancelled: number
  net: number
}

export interface PlanRevenue {
  plan: string
  revenue: number
}

export interface RevenueReport {
  totalRevenue: number
  newSubscriptions: number
  cancelled: number
  netSubscribers: number
  trend: RevenueTrendPoint[]
  byPlan: PlanRevenue[]
}

export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]