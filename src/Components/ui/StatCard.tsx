import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
}

export default function StatCard({ label, value, icon: Icon, hint }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className="rounded-lg bg-brand-soft p-2.5 text-brand">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}