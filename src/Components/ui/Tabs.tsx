interface Tab<T extends string> {
  key: T
  label: string
}

interface Props<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (key: T) => void
}

export default function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab.key === active
              ? 'border-brand text-brand'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}