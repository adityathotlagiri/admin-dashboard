export type Role = 'admin' | 'teacher' | 'student'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
}

/* ---------- Dashboard ---------- */

export interface DashboardStats {
  totalUsers: number
  students: number
  teachers: number
  admins: number
  publishedCourses: number
  unpublishedCourses: number
  activeSubscriptions: number
  inactiveSubscriptions: number
  totalRevenue: number
  monthlyRevenue: number
}

export interface UserGrowthPoint {
  month: string
  students: number
  teachers: number
}

export interface RevenuePoint {
  month: string
  revenue: number
}

export type ActivityType = 'user' | 'course' | 'subscription' | 'system'

export interface ActivityItem {
  id: string
  message: string
  actor: string
  time: string
  type: ActivityType
}

export type NotificationLevel = 'info' | 'warning' | 'success' | 'error'

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  level: NotificationLevel
}

/* ---------- User management ---------- */

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  status: UserStatus
  registeredAt: string
  lastActive: string
}

export interface UserFormValues {
  name: string
  email: string
  phone: string
  role: Role
}

export interface UserActivityItem {
  id: string
  action: string
  detail: string
  date: string
}

export type UserSortKey = 'name' | 'email' | 'role' | 'status' | 'registeredAt'

export interface UserQuery {
  search: string
  role: Role | 'all'
  status: UserStatus | 'all'
  sortBy: UserSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

/* ---------- Course management ---------- */

export type CourseStatus = 'draft' | 'pending' | 'published' | 'unpublished' | 'rejected'
export type CourseVisibility = 'public' | 'private'
export type CourseAvailability = 'open' | 'closed'

export interface Course {
  id: string
  title: string
  description: string
  category: string
  subject: string
  teacherId: string
  teacherName: string
  status: CourseStatus
  visibility: CourseVisibility
  availability: CourseAvailability
  price: number
  enrollments: number
  createdAt: string
  updatedAt: string
  rejectionReason?: string
}

export interface CourseFormValues {
  title: string
  description: string
  category: string
  subject: string
  teacherId: string
  price: string
  visibility: CourseVisibility
  availability: CourseAvailability
  publishNow: boolean
}

export interface CourseCategory {
  id: string
  name: string
  subjects: string[]
}

export interface Teacher {
  id: string
  name: string
}

export interface CourseStats {
  totalCourses: number
  published: number
  pendingApproval: number
  totalEnrollments: number
}

export interface EnrollmentPoint {
  month: string
  enrollments: number
}

export type CourseSortKey = 'title' | 'category' | 'status' | 'enrollments' | 'updatedAt'

export interface CourseQuery {
  search: string
  category: string
  status: CourseStatus | 'all'
  sortBy: CourseSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const COURSE_STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'rejected', label: 'Rejected' },
]

export const VISIBILITY_OPTIONS: { value: CourseVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

export const AVAILABILITY_OPTIONS: { value: CourseAvailability; label: string }[] = [
  { value: 'open', label: 'Enrollment open' },
  { value: 'closed', label: 'Enrollment closed' },
]

/* ---------- Subscription management ---------- */

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  billingCycle: BillingCycle
  features: string[]
  isActive: boolean
  subscribers: number
}

export interface PlanFormValues {
  name: string
  description: string
  price: string
  billingCycle: BillingCycle
  featuresText: string
  isActive: boolean
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export interface Subscription {
  id: string
  userName: string
  userEmail: string
  planId: string
  planName: string
  status: SubscriptionStatus
  startDate: string
  endDate: string
  autoRenew: boolean
  amount: number
}

export type TransactionStatus = 'success' | 'failed' | 'refunded'

export interface Transaction {
  id: string
  subscriptionId: string
  userName: string
  planName: string
  amount: number
  method: string
  status: TransactionStatus
  date: string
}

export interface SubscriptionStats {
  monthlyRevenue: number
  totalRevenue: number
  activeSubscriptions: number
  expiringSoon: number
}

export type SubscriptionSortKey =
  | 'userName'
  | 'planName'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'amount'

export interface SubscriptionQuery {
  search: string
  status: SubscriptionStatus | 'all'
  planId: string
  sortBy: SubscriptionSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export type TransactionSortKey = 'date' | 'amount' | 'userName' | 'status'

export interface TransactionQuery {
  search: string
  status: TransactionStatus | 'all'
  sortBy: TransactionSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const BILLING_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export const SUBSCRIPTION_STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const TRANSACTION_STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: 'success', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]