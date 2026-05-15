import { formatCurrency, formatDateShort } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ExportExpense {
  id: string
  title: string
  amount: string
  currency: string
  paidBy: string | null
  expenseDate: Date | null
  paymentStatus: string
  category: { name: string; color: string } | null
  event: { name: string }
  vendorName: string | null
  notes: string | null
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  ADVANCE_GIVEN: "Advance Given",
  PENDING: "Pending",
}

function formatStatus(s: string) {
  return PAYMENT_STATUS_LABELS[s] ?? s
}

function formatAmt(amount: string, currency: string) {
  return formatCurrency(amount, currency)
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export async function exportToPDF(
  expenses: ExportExpense[],
  eventName: string,
  totalAmount: number,
  currency: string
) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(60, 40, 20)
  doc.text("GettinHitched — Expense Report", 14, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(100, 80, 60)
  doc.text(eventName, 14, 26)
  doc.text(`Total: ${formatCurrency(totalAmount, currency)}`, 14, 33)
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 40)

  // Group expenses by event
  const byEvent: Record<string, ExportExpense[]> = {}
  for (const e of expenses) {
    const key = e.event.name
    if (!byEvent[key]) byEvent[key] = []
    byEvent[key].push(e)
  }

  let startY = 48

  for (const [evtName, evtExpenses] of Object.entries(byEvent)) {
    // Event sub-header
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(100, 60, 20)
    doc.text(evtName, 14, startY)

    const evtTotal = evtExpenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Subtotal: ${formatCurrency(evtTotal, currency)}`, 14, startY + 6)

    startY += 12

    const rows = evtExpenses.map((e) => [
      e.expenseDate ? formatDateShort(e.expenseDate) : "—",
      e.title,
      e.vendorName ?? "—",
      e.category?.name ?? "—",
      e.paidBy ?? "—",
      formatStatus(e.paymentStatus),
      formatAmt(e.amount, e.currency),
    ])

    autoTable(doc, {
      startY,
      head: [["Date", "Title", "Vendor", "Category", "Paid By", "Status", "Amount"]],
      body: rows,
      theme: "striped",
      headStyles: {
        fillColor: [201, 169, 110], // champagne-gold
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        6: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    })

    // @ts-ignore
    startY = doc.lastAutoTable.finalY + 10
  }

  doc.save(`expenses-${eventName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export async function exportToExcel(
  expenses: ExportExpense[],
  eventName: string,
  currency: string
) {
  const XLSX = await import("xlsx")

  // Group by event
  const byEvent: Record<string, ExportExpense[]> = {}
  for (const e of expenses) {
    const key = e.event.name
    if (!byEvent[key]) byEvent[key] = []
    byEvent[key].push(e)
  }

  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryRows: (string | number)[][] = [
    ["GettinHitched — Expense Report"],
    [eventName],
    [`Generated: ${new Date().toLocaleDateString("en-IN")}`],
    [],
    ["Event", "# Expenses", "Total Amount"],
    ...Object.entries(byEvent).map(([evtName, evtExpenses]) => [
      evtName,
      evtExpenses.length,
      evtExpenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0),
    ]),
    [],
    [
      "Grand Total",
      expenses.length,
      expenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0),
    ],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")

  // Per-event sheets
  for (const [evtName, evtExpenses] of Object.entries(byEvent)) {
    const rows = [
      ["Date", "Title", "Description", "Vendor", "Category", "Paid By", "Status", "Currency", "Amount"],
      ...evtExpenses.map((e) => [
        e.expenseDate ? formatDateShort(e.expenseDate) : "",
        e.title,
        e.notes ?? "",
        e.vendorName ?? "",
        e.category?.name ?? "",
        e.paidBy ?? "",
        formatStatus(e.paymentStatus),
        e.currency,
        parseFloat(e.amount || "0"),
      ]),
    ]
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    // Set column widths
    sheet["!cols"] = [
      { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 20 },
      { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
    ]
    const safeName = evtName.slice(0, 31) // Excel sheet name limit
    XLSX.utils.book_append_sheet(wb, sheet, safeName)
  }

  // All expenses sheet
  const allRows = [
    ["Date", "Title", "Event", "Vendor", "Category", "Paid By", "Status", "Currency", "Amount", "Notes"],
    ...expenses.map((e) => [
      e.expenseDate ? formatDateShort(e.expenseDate) : "",
      e.title,
      e.event.name,
      e.vendorName ?? "",
      e.category?.name ?? "",
      e.paidBy ?? "",
      formatStatus(e.paymentStatus),
      e.currency,
      parseFloat(e.amount || "0"),
      e.notes ?? "",
    ]),
  ]
  const allSheet = XLSX.utils.aoa_to_sheet(allRows)
  allSheet["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
    { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, allSheet, "All Expenses")

  XLSX.writeFile(wb, `expenses-${eventName.toLowerCase().replace(/\s+/g, "-")}.xlsx`)
}
