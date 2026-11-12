import { Workbook } from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ReportExport {
  title: string
  subtitle: string
  fileName: string
  summary: { label: string; value: string }[]
  headers: string[]
  rows: (string | number)[][]
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function exportReportPdf(report: ReportExport) {
  const doc = new jsPDF({
    orientation: report.headers.length > 5 ? 'landscape' : 'portrait',
  })

  doc.setFontSize(16)
  doc.setTextColor(3, 103, 36)
  doc.text(report.title, 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(report.subtitle, 14, 25)

  doc.setTextColor(40)
  let y = 34
  report.summary.forEach((item) => {
    doc.text(`${item.label}: ${item.value}`, 14, y)
    y += 6
  })

  autoTable(doc, {
    startY: y + 4,
    head: [report.headers],
    body: report.rows.map((row) => row.map((cell) => String(cell))),
    headStyles: { fillColor: [35, 139, 69] },
    alternateRowStyles: { fillColor: [245, 250, 247] },
    styles: { fontSize: 9 },
  })

  doc.save(`${report.fileName}.pdf`)
}

export async function exportReportExcel(report: ReportExport) {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('Report')

  const titleRow = sheet.addRow([report.title])
  titleRow.font = { bold: true, size: 14 }
  sheet.addRow([report.subtitle])
  sheet.addRow([])

  report.summary.forEach((item) => {
    const row = sheet.addRow([item.label, item.value])
    row.getCell(1).font = { bold: true }
  })
  sheet.addRow([])

  const headerRow = sheet.addRow(report.headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF238B45' } }
  })

  report.rows.forEach((row) => sheet.addRow(row))

  report.headers.forEach((_, index) => {
    sheet.getColumn(index + 1).width = 24
  })

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer as unknown as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${report.fileName}.xlsx`,
  )
}