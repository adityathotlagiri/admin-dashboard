import type { Paginated } from '../types'
import type {
  AlertStatus,
  ApiEndpoint,
  AuditCategory,
  AuditLog,
  AuditLogQuery,
  AuditResult,
  DatabaseStatus,
  ErrorLog,
  ErrorLogQuery,
  ErrorSummary,
  HealthStatus,
  ResourcePoint,
  ServiceInfo,
  SystemAlert,
  SystemSummary,
} from '../types/monitoring'
import { delay } from './delay'

const MINUTE = 60 * 1000
const minutesAgo = (m: number) => new Date(Date.now() - m * MINUTE).toISOString()
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const jitter = (base: number, spread: number) =>
  Math.max(1, Math.round(base + (Math.random() - 0.5) * spread))

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
}

function compareValues(left: string | number, right: string | number) {
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right))
}

/* ---------- Services ---------- */

interface ServiceBase {
  id: string
  name: string
  status: HealthStatus
  uptime: number
  latency: number
}

const serviceBase: ServiceBase[] = [
  { id: 'svc-1', name: 'API Gateway', status: 'operational', uptime: 99.99, latency: 42 },
  { id: 'svc-2', name: 'Authentication Service', status: 'operational', uptime: 99.98, latency: 58 },
  { id: 'svc-3', name: 'Course Service', status: 'operational', uptime: 99.95, latency: 74 },
  { id: 'svc-4', name: 'AI Tutor Service', status: 'operational', uptime: 99.82, latency: 310 },
  { id: 'svc-5', name: 'Payment Gateway', status: 'degraded', uptime: 99.2, latency: 880 },
  { id: 'svc-6', name: 'Notification Service', status: 'operational', uptime: 99.9, latency: 95 },
  { id: 'svc-7', name: 'File Storage', status: 'operational', uptime: 99.97, latency: 120 },
  { id: 'svc-8', name: 'Email Service', status: 'operational', uptime: 99.88, latency: 160 },
]

function computeOverallStatus(): HealthStatus {
  if (serviceBase.some((s) => s.status === 'down')) return 'down'
  if (serviceBase.some((s) => s.status === 'degraded')) return 'degraded'
  return 'operational'
}

export async function getServices(): Promise<ServiceInfo[]> {
  await delay(400)
  const checkedAt = new Date().toISOString()

  return serviceBase.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    uptime: s.uptime,
    latencyMs: jitter(s.latency, s.latency * 0.2),
    lastChecked: checkedAt,
  }))
}

/* ---------- API endpoints ---------- */

interface EndpointBase {
  id: string
  method: ApiEndpoint['method']
  path: string
  lastStatusCode: number
  avg: number
  p95: number
  rph: number
  errorRate: number
}

const endpointBase: EndpointBase[] = [
  { id: 'ep-1', method: 'POST', path: '/api/auth/login', lastStatusCode: 200, avg: 120, p95: 310, rph: 840, errorRate: 0.4 },
  { id: 'ep-2', method: 'GET', path: '/api/courses', lastStatusCode: 200, avg: 85, p95: 220, rph: 5200, errorRate: 0.2 },
  { id: 'ep-3', method: 'GET', path: '/api/users', lastStatusCode: 200, avg: 95, p95: 260, rph: 1900, errorRate: 0.3 },
  { id: 'ep-4', method: 'GET', path: '/api/dashboard/stats', lastStatusCode: 200, avg: 210, p95: 540, rph: 760, errorRate: 0.6 },
  { id: 'ep-5', method: 'POST', path: '/api/tutor/ask', lastStatusCode: 200, avg: 640, p95: 1500, rph: 2300, errorRate: 1.4 },
  { id: 'ep-6', method: 'POST', path: '/api/subscriptions/checkout', lastStatusCode: 502, avg: 780, p95: 1900, rph: 310, errorRate: 4.8 },
  { id: 'ep-7', method: 'PUT', path: '/api/courses/:id', lastStatusCode: 200, avg: 140, p95: 380, rph: 210, errorRate: 0.9 },
  { id: 'ep-8', method: 'DELETE', path: '/api/users/:id', lastStatusCode: 204, avg: 110, p95: 290, rph: 40, errorRate: 0 },
]

export async function getApiEndpoints(): Promise<ApiEndpoint[]> {
  await delay(450)

  return endpointBase.map((e) => {
    const avgResponseMs = jitter(e.avg, e.avg * 0.2)
    const errorRate = Number(clamp(e.errorRate + (Math.random() - 0.5) * 0.4, 0, 100).toFixed(1))
    const status: HealthStatus =
      errorRate >= 3 ? 'down' : errorRate >= 1 || avgResponseMs >= 500 ? 'degraded' : 'operational'

    return {
      id: e.id,
      method: e.method,
      path: e.path,
      status,
      lastStatusCode: e.lastStatusCode,
      avgResponseMs,
      p95Ms: jitter(e.p95, e.p95 * 0.15),
      requestsPerHour: jitter(e.rph, e.rph * 0.1),
      errorRate,
    }
  })
}

/* ---------- Database ---------- */

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  await delay(350)
  const avgQueryMs = jitter(24, 16)

  return {
    status: avgQueryMs >= 100 ? 'degraded' : 'operational',
    engine: 'PostgreSQL 16',
    activeConnections: jitter(46, 12),
    maxConnections: 100,
    avgQueryMs,
    slowQueries: jitter(4, 4),
    storageUsedGb: 38.4,
    storageTotalGb: 100,
    replicationLagMs: jitter(12, 10),
  }
}

/* ---------- Summary ---------- */

export async function getSystemSummary(): Promise<SystemSummary> {
  await delay(350)

  return {
    overallStatus: computeOverallStatus(),
    uptimePercent: 99.94,
    avgResponseMs: jitter(185, 40),
    errorRate: Number((1.2 + (Math.random() - 0.5) * 0.4).toFixed(1)),
    requestsPerMin: jitter(420, 80),
    openAlerts: alerts.filter((a) => a.status === 'open').length,
    diskUsage: 62,
  }
}

/* ---------- CPU & memory (simulated live feed) ---------- */

let cpuLevel = 38
let memoryLevel = 62

function nextPoint(timestamp: number): ResourcePoint {
  cpuLevel = clamp(cpuLevel + (Math.random() - 0.5) * 16, 8, 96)
  memoryLevel = clamp(memoryLevel + (Math.random() - 0.5) * 4, 45, 92)

  return {
    time: new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    cpu: Math.round(cpuLevel),
    memory: Math.round(memoryLevel),
  }
}

export async function getResourceHistory(count = 20): Promise<ResourcePoint[]> {
  await delay(400)
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => nextPoint(now - (count - 1 - i) * 5000))
}

export async function getResourceSample(): Promise<ResourcePoint> {
  await delay(200)
  return nextPoint(Date.now())
}

/* ---------- Alerts ---------- */

const alerts: SystemAlert[] = [
  {
    id: 'al-1',
    severity: 'critical',
    title: 'Payment gateway latency above threshold',
    description: 'Average response time has been over 800ms for the last 15 minutes.',
    source: 'Payment Gateway',
    createdAt: minutesAgo(18),
    status: 'open',
  },
  {
    id: 'al-2',
    severity: 'critical',
    title: 'Checkout endpoint returning 502 errors',
    description: 'More than 4% of checkout requests are failing with bad gateway errors.',
    source: '/api/subscriptions/checkout',
    createdAt: minutesAgo(25),
    status: 'open',
  },
  {
    id: 'al-3',
    severity: 'warning',
    title: 'High memory usage on app-server-02',
    description: 'Memory usage crossed 80% for more than 10 minutes.',
    source: 'app-server-02',
    createdAt: minutesAgo(46),
    status: 'open',
  },
  {
    id: 'al-4',
    severity: 'warning',
    title: 'Slow database queries detected',
    description: 'Several queries on the enrollments table took longer than 1 second.',
    source: 'PostgreSQL',
    createdAt: minutesAgo(95),
    status: 'acknowledged',
  },
  {
    id: 'al-5',
    severity: 'info',
    title: 'Scheduled maintenance window',
    description: 'Planned maintenance on Sunday between 2:00 AM and 3:00 AM.',
    source: 'Platform',
    createdAt: minutesAgo(180),
    status: 'open',
  },
  {
    id: 'al-6',
    severity: 'warning',
    title: 'AI tutor request queue backlog',
    description: 'Queue length exceeded 200 pending requests earlier today.',
    source: 'AI Tutor Service',
    createdAt: minutesAgo(300),
    status: 'resolved',
  },
  {
    id: 'al-7',
    severity: 'info',
    title: 'Nightly backup completed',
    description: 'Database backup finished successfully.',
    source: 'Backup job',
    createdAt: minutesAgo(600),
    status: 'resolved',
  },
  {
    id: 'al-8',
    severity: 'warning',
    title: 'SSL certificate expires in 21 days',
    description: 'Renew the certificate for the API gateway before it expires.',
    source: 'API Gateway',
    createdAt: minutesAgo(1440),
    status: 'acknowledged',
  },
]

export async function getAlerts(): Promise<SystemAlert[]> {
  await delay(400)
  return [...alerts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({ ...a }))
}

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<void> {
  await delay(400)
  const index = alerts.findIndex((a) => a.id === id)
  if (index === -1) throw new Error('Alert not found')
  alerts[index] = { ...alerts[index], status }
}

/* ---------- Error logs ---------- */

type ErrorTemplate = Pick<ErrorLog, 'type' | 'source' | 'statusCode' | 'message'>

const errorTemplates: ErrorTemplate[] = [
  { type: 'request', source: 'POST /api/subscriptions/checkout', statusCode: 502, message: 'Bad gateway: payment provider timed out' },
  { type: 'request', source: 'GET /api/courses/:id', statusCode: 404, message: 'Course not found' },
  { type: 'request', source: 'POST /api/auth/login', statusCode: 401, message: 'Invalid credentials' },
  { type: 'application', source: 'AI Tutor Service', statusCode: null, message: 'Unhandled exception: model response timeout' },
  { type: 'request', source: 'PUT /api/users/:id', statusCode: 422, message: 'Validation failed: email already exists' },
  { type: 'application', source: 'Email Service', statusCode: null, message: 'SMTP connection reset by peer' },
  { type: 'request', source: 'GET /api/users', statusCode: 500, message: 'Internal server error: database connection lost' },
  { type: 'application', source: 'Report Generator', statusCode: null, message: 'Failed to render PDF: out of memory' },
]

const errorLogs: ErrorLog[] = Array.from({ length: 40 }, (_, i) => {
  const template = errorTemplates[i % errorTemplates.length]
  return {
    id: `err-${i + 1}`,
    timestamp: minutesAgo(5 + i * 37),
    occurrences: 1 + ((i * 7) % 23),
    ...template,
  }
})

export async function getErrorLogs(query: ErrorLogQuery): Promise<Paginated<ErrorLog>> {
  await delay(400)
  const term = query.search.trim().toLowerCase()

  const filtered = errorLogs.filter((e) => {
    const matchesSearch =
      !term || e.source.toLowerCase().includes(term) || e.message.toLowerCase().includes(term)
    const matchesType = query.type === 'all' || e.type === query.type
    return matchesSearch && matchesType
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[query.sortBy], b[query.sortBy])
    return query.sortDir === 'asc' ? cmp : -cmp
  })

  return paginate(sorted, query.page, query.pageSize)
}

export async function getErrorSummary(): Promise<ErrorSummary> {
  await delay(350)
  const dayAgo = Date.now() - 24 * 60 * MINUTE
  const recent = errorLogs.filter((e) => new Date(e.timestamp).getTime() >= dayAgo)
  const total = (type: ErrorLog['type']) =>
    recent.filter((e) => e.type === type).reduce((sum, e) => sum + e.occurrences, 0)

  return {
    failedRequests24h: total('request'),
    applicationErrors24h: total('application'),
    openAlerts: alerts.filter((a) => a.status === 'open').length,
  }
}

/* ---------- Audit logs ---------- */

interface AuditTemplate {
  actor: string
  action: string
  category: AuditCategory
  target: string
  result: AuditResult
}

const auditTemplates: AuditTemplate[] = [
  { actor: 'Super Admin', action: 'login.success', category: 'auth', target: 'Admin panel', result: 'success' },
  { actor: 'unknown@example.com', action: 'login.failed', category: 'auth', target: 'Admin panel', result: 'failed' },
  { actor: 'Super Admin', action: 'user.create', category: 'user', target: 'Priya Sharma', result: 'success' },
  { actor: 'Super Admin', action: 'user.suspend', category: 'user', target: 'Rahul Verma', result: 'success' },
  { actor: 'Super Admin', action: 'user.role_change', category: 'user', target: 'Ananya Rao → teacher', result: 'success' },
  { actor: 'Super Admin', action: 'course.approve', category: 'course', target: 'Python Fundamentals', result: 'success' },
  { actor: 'Super Admin', action: 'course.reject', category: 'course', target: 'Advanced Calculus', result: 'success' },
  { actor: 'Super Admin', action: 'course.delete', category: 'course', target: 'Spanish Fundamentals', result: 'success' },
  { actor: 'Super Admin', action: 'plan.update', category: 'subscription', target: 'Pro plan pricing', result: 'success' },
  { actor: 'Super Admin', action: 'subscription.cancel', category: 'subscription', target: 'sub-12', result: 'success' },
  { actor: 'Super Admin', action: 'settings.update', category: 'system', target: 'Maintenance window', result: 'success' },
  { actor: 'System', action: 'backup.run', category: 'system', target: 'Nightly backup', result: 'success' },
  { actor: 'System', action: 'backup.run', category: 'system', target: 'Weekly archive', result: 'failed' },
]

const auditLogs: AuditLog[] = Array.from({ length: 60 }, (_, i) => {
  const template = auditTemplates[(i * 5) % auditTemplates.length]
  return {
    id: `aud-${i + 1}`,
    timestamp: minutesAgo(3 + i * 53),
    ip: template.actor === 'System' ? 'internal' : `103.${(i * 7) % 255}.${(i * 13) % 255}.${(i * 29) % 255}`,
    ...template,
  }
})

export async function getAuditLogs(query: AuditLogQuery): Promise<Paginated<AuditLog>> {
  await delay(400)
  const term = query.search.trim().toLowerCase()

  const filtered = auditLogs.filter((log) => {
    const matchesSearch =
      !term ||
      log.actor.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term)
    const matchesCategory = query.category === 'all' || log.category === query.category
    const matchesResult = query.result === 'all' || log.result === query.result
    return matchesSearch && matchesCategory && matchesResult
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[query.sortBy], b[query.sortBy])
    return query.sortDir === 'asc' ? cmp : -cmp
  })

  return paginate(sorted, query.page, query.pageSize)
}