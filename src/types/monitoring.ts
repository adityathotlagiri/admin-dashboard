export type HealthStatus = 'operational' | 'degraded' | 'down'

export interface SystemSummary {
  overallStatus: HealthStatus
  uptimePercent: number
  avgResponseMs: number
  errorRate: number
  requestsPerMin: number
  openAlerts: number
  diskUsage: number
}

export interface ServiceInfo {
  id: string
  name: string
  status: HealthStatus
  uptime: number
  latencyMs: number
  lastChecked: string
}

export interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  status: HealthStatus
  lastStatusCode: number
  avgResponseMs: number
  p95Ms: number
  requestsPerHour: number
  errorRate: number
}

export interface DatabaseStatus {
  status: HealthStatus
  engine: string
  activeConnections: number
  maxConnections: number
  avgQueryMs: number
  slowQueries: number
  storageUsedGb: number
  storageTotalGb: number
  replicationLagMs: number
}

export interface ResourcePoint {
  time: string
  cpu: number
  memory: number
}

/* ---------- Alerts & errors ---------- */

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'

export interface SystemAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  source: string
  createdAt: string
  status: AlertStatus
}

export type ErrorType = 'application' | 'request'

export interface ErrorLog {
  id: string
  timestamp: string
  type: ErrorType
  source: string
  statusCode: number | null
  message: string
  occurrences: number
}

export interface ErrorSummary {
  failedRequests24h: number
  applicationErrors24h: number
  openAlerts: number
}

export type ErrorSortKey = 'timestamp' | 'occurrences'

export interface ErrorLogQuery {
  search: string
  type: ErrorType | 'all'
  sortBy: ErrorSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

/* ---------- Audit logs ---------- */

export type AuditCategory = 'auth' | 'user' | 'course' | 'subscription' | 'system'
export type AuditResult = 'success' | 'failed'

export interface AuditLog {
  id: string
  timestamp: string
  actor: string
  action: string
  category: AuditCategory
  target: string
  ip: string
  result: AuditResult
}

export type AuditSortKey = 'timestamp' | 'actor' | 'action'

export interface AuditLogQuery {
  search: string
  category: AuditCategory | 'all'
  result: AuditResult | 'all'
  sortBy: AuditSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const ALERT_STATUS_OPTIONS: { value: AlertStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
]

export const ERROR_TYPE_OPTIONS: { value: ErrorType; label: string }[] = [
  { value: 'request', label: 'Failed requests' },
  { value: 'application', label: 'Application errors' },
]

export const AUDIT_CATEGORY_OPTIONS: { value: AuditCategory; label: string }[] = [
  { value: 'auth', label: 'Authentication' },
  { value: 'user', label: 'Users' },
  { value: 'course', label: 'Courses' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'system', label: 'System' },
]

export const AUDIT_RESULT_OPTIONS: { value: AuditResult; label: string }[] = [
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
]