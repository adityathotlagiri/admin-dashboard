import type { ReactNode } from 'react'

export type BadgeTone = 'green' | 'gray' | 'red' | 'amber' | 'blue'

const tones: Record<BadgeTone, string> = {
  green: 'bg-brand-soft text-brand-hover',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
}

export default function Badge({
  tone = 'gray',
  children,
}: {
  tone?: BadgeTone
  children: ReactNode
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}