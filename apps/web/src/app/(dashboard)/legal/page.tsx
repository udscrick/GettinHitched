"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, FileText, Shield, User } from "lucide-react"

const DEFAULT_NAME_CHANGE_ITEMS = [
  "Social Security Card",
  "Driver's License / State ID",
  "Passport",
  "Bank Accounts",
  "Credit Cards",
  "Voter Registration",
  "Work/HR Records",
  "Email Address",
  "Social Media Profiles",
  "Medical Records",
  "Health Insurance",
  "Life Insurance",
  "Vehicle Registration / Title",
  "Mortgage / Lease",
  "Will / Estate Documents",
  "Subscriptions & Memberships",
  "Utilities",
  "Retirement Accounts (401k/IRA)",
]

type CheckItem = { id: string; name: string; done: boolean; notes: string }

export default function LegalPage() {
  const [loading, setLoading] = useState(false)
  const [weddingId, setWeddingId] = useState("")

  const [license, setLicense] = useState({
    licenseState: "",
    licenseObtained: false,
    licenseDate: "",
    waitingPeriodDays: "",
    licenseExpiryDate: "",
  })

  const [prenup, setPrenup] = useState({
    prenupStatus: "none",
    prenupNotes: "",
  })

  const [nameChangeItems, setNameChangeItems] = useState<CheckItem[]>(
    DEFAULT_NAME_CHANGE_ITEMS.map((name, i) => ({
      id: `nc-${i}`,
      name,
      done: false,
      notes: "",
    }))
  )

  const [generalNotes, setGeneralNotes] = useState("")

  useEffect(() => {
    fetch("/api/legal")
      .then((r) => r.json())
      .then((data) => {
        setWeddingId(data.weddingId ?? "")
        if (data.legal) {
          const l = data.legal
          setLicense({
            licenseState: l.licenseState ?? "",
            licenseObtained: l.licenseObtained ?? false,
            licenseDate: l.licenseDate ? new Date(l.licenseDate).toISOString().slice(0, 10) : "",
            waitingPeriodDays: l.waitingPeriodDays?.toString() ?? "",
            licenseExpiryDate: l.licenseExpiryDate ? new Date(l.licenseExpiryDate).toISOString().slice(0, 10) : "",
          })
          setPrenup({
            prenupStatus: l.prenupStatus ?? "none",
            prenupNotes: l.prenupNotes ?? "",
          })
          setGeneralNotes(l.notes ?? "")
          if (l.nameChangeItems) {
            try { setNameChangeItems(JSON.parse(l.nameChangeItems)) } catch {}
          }
        }
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch("/api/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          ...license,
          waitingPeriodDays: license.waitingPeriodDays ? parseInt(license.waitingPeriodDays) : undefined,
          ...prenup,
          nameChangeItems: JSON.stringify(nameChangeItems),
          notes: generalNotes,
        }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success("Legal checklist saved!")
    } finally {
      setLoading(false)
    }
  }

  const completedCount = nameChangeItems.filter((i) => i.done).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Legal & Admin</h1>
          <p className="text-muted-foreground mt-1">Marriage license, name changes, and documents</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Marriage License */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Marriage License
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>State / Jurisdiction</Label>
            <Input
              value={license.licenseState}
              onChange={(e) => setLicense({ ...license, licenseState: e.target.value })}
              placeholder="California"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="licenseObtained"
              checked={license.licenseObtained}
              onChange={(e) => setLicense({ ...license, licenseObtained: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor="licenseObtained">License Obtained</Label>
          </div>
          <div className="space-y-2">
            <Label>Date Obtained</Label>
            <Input
              type="date"
              value={license.licenseDate}
              onChange={(e) => setLicense({ ...license, licenseDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Waiting Period (days)</Label>
            <Input
              type="number"
              value={license.waitingPeriodDays}
              onChange={(e) => setLicense({ ...license, waitingPeriodDays: e.target.value })}
              placeholder="3"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>License Expiry Date</Label>
            <Input
              type="date"
              value={license.licenseExpiryDate}
              onChange={(e) => setLicense({ ...license, licenseExpiryDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pre-nup */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Pre-nuptial Agreement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-3">
              {["none", "considering", "in_progress", "signed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setPrenup({ ...prenup, prenupStatus: status })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    prenup.prenupStatus === status
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {status === "none" ? "Not Considering" :
                   status === "considering" ? "Considering" :
                   status === "in_progress" ? "In Progress" : "Signed"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={prenup.prenupNotes}
              onChange={(e) => setPrenup({ ...prenup, prenupNotes: e.target.value })}
              placeholder="Attorney contact info, key terms, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Name Change Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Name Change Checklist
            </CardTitle>
            <Badge variant="secondary">
              {completedCount} / {nameChangeItems.length} done
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {nameChangeItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                item.done ? "bg-muted/50 border-muted" : "border-border"
              }`}
            >
              <button
                onClick={() =>
                  setNameChangeItems(
                    nameChangeItems.map((i) =>
                      i.id === item.id ? { ...i, done: !i.done } : i
                    )
                  )
                }
                className="shrink-0"
              >
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
                {item.name}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">General Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Attorney contacts, document storage locations, beneficiary reminders..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
