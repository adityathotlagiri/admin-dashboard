import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export default function Textarea({ label, error, id, className = '', ...rest }: Props) {
  const fieldId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={4}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-gray-300 focus:border-brand focus:ring-brand/20'
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}