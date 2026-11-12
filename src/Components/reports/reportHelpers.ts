import type { DateRange } from '../../types/reports'
import { formatInputDate } from '../../utils/dateRange'
import { formatDateTime } from '../../utils/format'

export function describeRange(range: DateRange) {
  return `Date range: ${formatInputDate(range.from)} – ${formatInputDate(range.to)} · Generated ${formatDateTime(new Date().toISOString())}`
}

export function rangeSummary(range: DateRange) {
  return `${formatInputDate(range.from)} – ${formatInputDate(range.to)}`
}