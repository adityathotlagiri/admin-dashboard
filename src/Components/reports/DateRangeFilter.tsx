import { RANGE_PRESET_OPTIONS, type RangePreset } from '../../utils/dateRange'
import Input from '../ui/Input'
import Select from '../ui/Select'

interface Props {
  preset: RangePreset
  from: string
  to: string
  onPresetChange: (preset: RangePreset) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export default function DateRangeFilter({
  preset,
  from,
  to,
  onPresetChange,
  onFromChange,
  onToChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
      <Select
        label="Date range"
        value={preset}
        onChange={(e) => onPresetChange(e.target.value as RangePreset)}
        options={RANGE_PRESET_OPTIONS}
      />
      {preset === 'custom' && (
        <>
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
          <Input label="To" type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
        </>
      )}
    </div>
  )
}