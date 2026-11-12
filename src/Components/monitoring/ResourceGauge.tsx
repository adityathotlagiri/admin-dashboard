interface Props {
  label: string
  value: number
  detail?: string
}

export default function ResourceGauge({ label, value, detail }: Props) {
  const color = value >= 85 ? 'bg-red-500' : value >= 70 ? 'bg-amber-500' : 'bg-brand'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {detail && <p className="mt-2 text-xs text-gray-400">{detail}</p>}
    </div>
  )
}