import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import type { ReportExport } from '../../utils/exportReport'
import Button from '../ui/Button'

interface Props {
  getReport: () => Promise<ReportExport | null>
  disabled?: boolean
}

export default function ExportButtons({ getReport, disabled = false }: Props) {
  const toast = useToast()
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null)

  const run = async (kind: 'pdf' | 'excel') => {
    setBusy(kind)
    try {
      const report = await getReport()
      if (!report || report.rows.length === 0) {
        toast.error('There is no data to export for this date range')
        return
      }

      // Loaded on demand so the export libraries don't slow down the rest of the app
      const { exportReportPdf, exportReportExcel } = await import('../../utils/exportReport')

      if (kind === 'pdf') exportReportPdf(report)
      else await exportReportExcel(report)

      toast.success(kind === 'pdf' ? 'PDF report downloaded' : 'Excel report downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        loading={busy === 'pdf'}
        disabled={disabled || busy !== null}
        onClick={() => run('pdf')}
      >
        <FileText size={16} />
        Export PDF
      </Button>
      <Button
        variant="outline"
        loading={busy === 'excel'}
        disabled={disabled || busy !== null}
        onClick={() => run('excel')}
      >
        <FileSpreadsheet size={16} />
        Export Excel
      </Button>
    </div>
  )
}