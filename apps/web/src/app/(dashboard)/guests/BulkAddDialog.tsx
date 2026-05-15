"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Papa from "papaparse"
import { bulkCreateGuests } from "@/actions/guests"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, Upload } from "lucide-react"

type RowData = {
  _id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  side: string
  rsvpStatus: string
  isChild: boolean
}

let _nextId = 1

function makeRow(): RowData {
  return {
    _id: _nextId++,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    side: "BOTH",
    rsvpStatus: "PENDING",
    isChild: false,
  }
}

function makeRows(n: number): RowData[] {
  return Array.from({ length: n }, makeRow)
}

function mapSide(v: string): string {
  const u = (v ?? "").toUpperCase()
  if (u.includes("ONE") || u === "1" || u === "PARTNER_ONE" || u === "PARTNER1") return "PARTNER_ONE"
  if (u.includes("TWO") || u === "2" || u === "PARTNER_TWO" || u === "PARTNER2") return "PARTNER_TWO"
  return "BOTH"
}

function mapRsvp(v: string): string {
  const u = (v ?? "").toUpperCase()
  if (u === "ATTENDING" || u === "YES" || u === "CONFIRMED") return "ATTENDING"
  if (u === "DECLINED" || u === "NO") return "DECLINED"
  if (u === "MAYBE") return "MAYBE"
  return "PENDING"
}

function parseRows(text: string): RowData[] {
  if (!text.trim()) return []
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  return result.data.map((row): RowData => ({
    _id: _nextId++,
    firstName: row.firstName ?? row.first_name ?? row["First Name"] ?? "",
    lastName: row.lastName ?? row.last_name ?? row["Last Name"] ?? "",
    email: row.email ?? row.Email ?? "",
    phone: row.phone ?? row.Phone ?? "",
    side: mapSide(row.side ?? row.Side ?? ""),
    rsvpStatus: mapRsvp(row.rsvpStatus ?? row.rsvp ?? row.RSVP ?? ""),
    isChild:
      (row.isChild ?? row.child ?? "").toLowerCase() === "true" ||
      (row.isChild ?? row.child ?? "") === "1",
  }))
}

const TEMPLATE_CSV =
  "firstName,lastName,email,phone,side,rsvpStatus,isChild\n" +
  "Jane,Smith,jane@example.com,+15550123,Both,Pending,false\n" +
  "John,Doe,,,Partner1,Pending,false"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  eventId: string
  sideLabels: Record<string, string>
}

export function BulkAddDialog({ open, onOpenChange, eventId, sideLabels }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<"grid" | "csv">("grid")
  const [rows, setRows] = useState<RowData[]>(() => makeRows(5))
  const [csvText, setCsvText] = useState("")
  const [csvRows, setCsvRows] = useState<RowData[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function updateRow(id: number, field: keyof RowData, value: string | boolean) {
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()])
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._id !== id) : prev))
  }

  function handleCsvChange(text: string) {
    setCsvText(text)
    setCsvRows(parseRows(text))
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      handleCsvChange(text)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "guests-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSubmit() {
    const source = tab === "grid" ? rows : csvRows
    const valid = source.filter((r) => r.firstName.trim() && r.lastName.trim())

    if (valid.length === 0) {
      toast.error("Add at least one guest with first and last name")
      return
    }

    setLoading(true)
    try {
      const payload = valid.map(({ _id: _unused, ...rest }) => ({
        ...rest,
        email: rest.email || undefined,
        phone: rest.phone || undefined,
      }))
      const res = await bulkCreateGuests(eventId, payload)
      if ("error" in res && res.error) {
        toast.error(res.error)
        return
      }
      if ("created" in res) {
        toast.success(`${res.created} guest${res.created !== 1 ? "s" : ""} added!`)
        if (res.errors?.length) toast.warning(`${res.errors.length} row(s) skipped due to validation errors`)
      }
      onOpenChange(false)
      setRows(makeRows(5))
      setCsvText("")
      setCsvRows([])
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const activeRows = tab === "grid" ? rows : csvRows
  const validCount = activeRows.filter((r) => r.firstName.trim() && r.lastName.trim()).length

  const tabClass = (t: "grid" | "csv") =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? "border-[#C9A96E] text-[#C9A96E]"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`

  const selectClass =
    "h-8 text-sm w-full rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-serif">Bulk Add Guests</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-0 border-b px-6 mt-4">
          <button className={tabClass("grid")} onClick={() => setTab("grid")}>
            Spreadsheet
          </button>
          <button className={tabClass("csv")} onClick={() => setTab("csv")}>
            CSV Import
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4 min-h-0">
          {tab === "grid" ? (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Fill in rows directly. First Name and Last Name are required. Press Enter on the last row to add another.
              </p>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm" style={{ minWidth: 760 }}>
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-2 text-left font-medium text-xs w-[130px]">First Name *</th>
                      <th className="p-2 text-left font-medium text-xs w-[130px]">Last Name *</th>
                      <th className="p-2 text-left font-medium text-xs w-[180px]">Email</th>
                      <th className="p-2 text-left font-medium text-xs w-[130px]">Phone</th>
                      <th className="p-2 text-left font-medium text-xs w-[130px]">Side</th>
                      <th className="p-2 text-left font-medium text-xs w-[110px]">RSVP</th>
                      <th className="p-2 text-center font-medium text-xs w-[60px]">Child</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row, idx) => (
                      <tr key={row._id} className="hover:bg-muted/10">
                        <td className="p-1">
                          <Input
                            value={row.firstName}
                            onChange={(e) => updateRow(row._id, "firstName", e.target.value)}
                            placeholder="Jane"
                            className="h-8 text-xs"
                            onKeyDown={(e) =>
                              e.key === "Enter" && idx === rows.length - 1 && addRow()
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            value={row.lastName}
                            onChange={(e) => updateRow(row._id, "lastName", e.target.value)}
                            placeholder="Smith"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            value={row.email}
                            onChange={(e) => updateRow(row._id, "email", e.target.value)}
                            placeholder="jane@example.com"
                            className="h-8 text-xs"
                            type="email"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            value={row.phone}
                            onChange={(e) => updateRow(row._id, "phone", e.target.value)}
                            placeholder="+1 555 0123"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <select
                            value={row.side}
                            onChange={(e) => updateRow(row._id, "side", e.target.value)}
                            className={selectClass}
                          >
                            <option value="PARTNER_ONE">{sideLabels.PARTNER_ONE}</option>
                            <option value="PARTNER_TWO">{sideLabels.PARTNER_TWO}</option>
                            <option value="BOTH">Both</option>
                          </select>
                        </td>
                        <td className="p-1">
                          <select
                            value={row.rsvpStatus}
                            onChange={(e) => updateRow(row._id, "rsvpStatus", e.target.value)}
                            className={selectClass}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ATTENDING">Attending</option>
                            <option value="DECLINED">Declined</option>
                            <option value="MAYBE">Maybe</option>
                          </select>
                        </td>
                        <td className="p-1 text-center">
                          <input
                            type="checkbox"
                            checked={row.isChild}
                            onChange={(e) => updateRow(row._id, "isChild", e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-1">
                          <button
                            onClick={() => removeRow(row._id)}
                            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-base leading-none"
                            title="Remove row"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addRow}
                className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV File
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="text-muted-foreground text-sm">or paste CSV below</span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Columns: <code className="bg-muted px-1 rounded">firstName, lastName, email, phone, side, rsvpStatus, isChild</code>
                  {" — "}side accepts Partner1/Partner2/Both; rsvpStatus accepts Pending/Attending/Declined/Maybe
                </p>
                <Textarea
                  value={csvText}
                  onChange={(e) => handleCsvChange(e.target.value)}
                  placeholder={TEMPLATE_CSV}
                  rows={7}
                  className="font-mono text-xs"
                />
              </div>

              {csvRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Preview —{" "}
                    <span className="text-muted-foreground font-normal">
                      {csvRows.length} row{csvRows.length !== 1 ? "s" : ""} detected
                    </span>
                  </p>
                  <div className="overflow-x-auto rounded border">
                    <table className="w-full text-xs" style={{ minWidth: 480 }}>
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-2 text-left font-medium">First</th>
                          <th className="p-2 text-left font-medium">Last</th>
                          <th className="p-2 text-left font-medium">Email</th>
                          <th className="p-2 text-left font-medium">Phone</th>
                          <th className="p-2 text-left font-medium">Side</th>
                          <th className="p-2 text-left font-medium">RSVP</th>
                          <th className="p-2 text-left font-medium">Child</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {csvRows.map((r) => (
                          <tr
                            key={r._id}
                            className={!r.firstName || !r.lastName ? "bg-red-50" : ""}
                          >
                            <td className="p-2">
                              {r.firstName || (
                                <span className="text-red-500 font-medium">missing</span>
                              )}
                            </td>
                            <td className="p-2">
                              {r.lastName || (
                                <span className="text-red-500 font-medium">missing</span>
                              )}
                            </td>
                            <td className="p-2 text-muted-foreground">{r.email}</td>
                            <td className="p-2 text-muted-foreground">{r.phone}</td>
                            <td className="p-2">{r.side}</td>
                            <td className="p-2">{r.rsvpStatus}</td>
                            <td className="p-2">{r.isChild ? "Yes" : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {validCount > 0
              ? `${validCount} guest${validCount !== 1 ? "s" : ""} ready to add`
              : "First + Last Name required for each guest"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || validCount === 0}>
              {loading
                ? "Adding..."
                : `Add ${validCount > 0 ? validCount + " " : ""}Guest${validCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
