import type { DateRange } from '../types/reports'

export type RangePreset = '7d' | '30d' | '90d' | '12m' | 'ytd' | 'custom'

export const RANGE_PRESET_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' },
]

export function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseInputDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatInputDate(value: string) {
  return parseInputDate(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getPresetRange(preset: Exclude<RangePreset, 'custom'>): DateRange {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (preset === '7d') from.setDate(from.getDate() - 6)
  else if (preset === '30d') from.setDate(from.getDate() - 29)
  else if (preset === '90d') from.setDate(from.getDate() - 89)
  else if (preset === '12m') from.setFullYear(from.getFullYear() - 1)
  else {
    from.setMonth(0)
    from.setDate(1)
  }

  return { from: toInputDate(from), to: toInputDate(today) }
}