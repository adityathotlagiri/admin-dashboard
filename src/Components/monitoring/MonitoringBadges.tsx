import Badge, { type BadgeTone } from '../ui/Badge'
import type {
  AlertSeverity,
  AlertStatus,
  ApiEndpoint,
  AuditResult,
  ErrorType,
  HealthStatus,
} from '../../types/monitoring'

const healthTone: Record<HealthStatus, BadgeTone> = {
  operational: 'green',
  degraded: 'amber',
  down: 'red',
}

const serviceLabel: Record<HealthStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}

const endpointLabel: Record<HealthStatus, string> = {
  operational: 'Healthy',
  degraded: 'Slow',
  down: 'Failing',
}

const severityTone: Record<AlertSeverity, BadgeTone> = {
  critical: 'red',
  warning: 'amber',
  info: 'blue',
}

const alertStatusTone: Record<AlertStatus, BadgeTone> = {
  open: 'red',
  acknowledged: 'amber',
  resolved: 'green',
}

const methodTone: Record<ApiEndpoint['method'], BadgeTone> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'amber',
  DELETE: 'red',
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  return <Badge tone={healthTone[status]}>{serviceLabel[status]}</Badge>
}

export function EndpointHealthBadge({ status }: { status: HealthStatus }) {
  return <Badge tone={healthTone[status]}>{endpointLabel[status]}</Badge>
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <Badge tone={severityTone[severity]}>
      <span className="capitalize">{severity}</span>
    </Badge>
  )
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return (
    <Badge tone={alertStatusTone[status]}>
      <span className="capitalize">{status}</span>
    </Badge>
  )
}

export function MethodBadge({ method }: { method: ApiEndpoint['method'] }) {
  return <Badge tone={methodTone[method]}>{method}</Badge>
}

export function ErrorTypeBadge({ type }: { type: ErrorType }) {
  return (
    <Badge tone={type === 'application' ? 'red' : 'amber'}>
      {type === 'application' ? 'Application' : 'Request'}
    </Badge>
  )
}

export function AuditResultBadge({ result }: { result: AuditResult }) {
  return (
    <Badge tone={result === 'success' ? 'green' : 'red'}>
      <span className="capitalize">{result}</span>
    </Badge>
  )
}