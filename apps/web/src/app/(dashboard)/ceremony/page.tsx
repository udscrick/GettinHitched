"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { saveCeremony } from "./actions"
import {
  Music,
  List,
  Heart,
  Clock,
  Users,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react"

const TABS = [
  { id: "details", label: "Details", icon: Clock },
  { id: "program", label: "Program", icon: List },
  { id: "vows", label: "Vows", icon: Heart },
  { id: "music", label: "Music", icon: Music },
  { id: "processional", label: "Processional", icon: Users },
]

const DEFAULT_PROGRAM_ITEMS = [
  "Prelude",
  "Processional",
  "Opening Words",
  "Reading",
  "Exchange of Vows",
  "Exchange of Rings",
  "Unity Ceremony",
  "Pronouncement",
  "The Kiss",
  "Recessional",
]

type ProgramItem = { id: string; title: string; notes: string }
type ProcessionalPerson = { id: string; name: string; role: string }
type CeremonyMusic = {
  prelude: string
  processional: string
  duringCeremony: string
  recessional: string
}

export default function CeremonyPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [weddingId, setWeddingId] = useState("")

  const [details, setDetails] = useState({
    officiantName: "",
    officiantContact: "",
    officiantEmail: "",
    startTime: "",
    duration: "",
    location: "",
    dresscode: "",
  })

  const [programItems, setProgramItems] = useState<ProgramItem[]>(
    DEFAULT_PROGRAM_ITEMS.map((title, i) => ({
      id: `item-${i}`,
      title,
      notes: "",
    }))
  )

  const [vows, setVows] = useState({ partnerOne: "", partnerTwo: "" })
  const [music, setMusic] = useState<CeremonyMusic>({
    prelude: "",
    processional: "",
    duringCeremony: "",
    recessional: "",
  })
  const [processionalOrder, setProcessionalOrder] = useState<ProcessionalPerson[]>([])

  useEffect(() => {
    fetch("/api/ceremony")
      .then((r) => r.json())
      .then((data) => {
        setWeddingId(data.weddingId ?? "")
        if (data.ceremony) {
          const c = data.ceremony
          setDetails({
            officiantName: c.officiantName ?? "",
            officiantContact: c.officiantContact ?? "",
            officiantEmail: c.officiantEmail ?? "",
            startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : "",
            duration: c.duration?.toString() ?? "",
            location: c.location ?? "",
            dresscode: c.dresscode ?? "",
          })
          if (c.partnerOneVows) setVows((v) => ({ ...v, partnerOne: c.partnerOneVows }))
          if (c.partnerTwoVows) setVows((v) => ({ ...v, partnerTwo: c.partnerTwoVows }))
          if (c.programItems) {
            try { setProgramItems(JSON.parse(c.programItems)) } catch {}
          }
          if (c.processionalOrder) {
            try { setProcessionalOrder(JSON.parse(c.processionalOrder)) } catch {}
          }
          if (c.ceremonyMusic) {
            try { setMusic(JSON.parse(c.ceremonyMusic)) } catch {}
          }
        }
        setInitialLoad(false)
      })
      .catch(() => setInitialLoad(false))
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await saveCeremony(weddingId, {
        officiantName: details.officiantName || undefined,
        officiantContact: details.officiantContact || undefined,
        officiantEmail: details.officiantEmail || undefined,
        startTime: details.startTime || undefined,
        duration: details.duration ? parseInt(details.duration) : undefined,
        location: details.location || undefined,
        dresscode: details.dresscode || undefined,
        partnerOneVows: vows.partnerOne || undefined,
        partnerTwoVows: vows.partnerTwo || undefined,
        programItems: JSON.stringify(programItems),
        processionalOrder: JSON.stringify(processionalOrder),
        ceremonyMusic: JSON.stringify(music),
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Ceremony details saved!")
    } finally {
      setLoading(false)
    }
  }

  function addProgramItem() {
    setProgramItems([
      ...programItems,
      { id: `item-${Date.now()}`, title: "New Section", notes: "" },
    ])
  }

  function removeProgramItem(id: string) {
    setProgramItems(programItems.filter((i) => i.id !== id))
  }

  function addProcessionalPerson() {
    setProcessionalOrder([
      ...processionalOrder,
      { id: `p-${Date.now()}`, name: "", role: "" },
    ])
  }

  function removeProcessionalPerson(id: string) {
    setProcessionalOrder(processionalOrder.filter((p) => p.id !== id))
  }

  if (initialLoad) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-serif text-3xl font-bold">Ceremony Planning</h1>
        </div>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Ceremony Planning</h1>
          <p className="text-muted-foreground mt-1">Plan every detail of your ceremony</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Ceremony Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Officiant Name</Label>
              <Input
                value={details.officiantName}
                onChange={(e) => setDetails({ ...details, officiantName: e.target.value })}
                placeholder="Reverend Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Officiant Contact</Label>
              <Input
                value={details.officiantContact}
                onChange={(e) => setDetails({ ...details, officiantContact: e.target.value })}
                placeholder="+1 555 0123"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Officiant Email</Label>
              <Input
                type="email"
                value={details.officiantEmail}
                onChange={(e) => setDetails({ ...details, officiantEmail: e.target.value })}
                placeholder="officiant@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={details.startTime}
                onChange={(e) => setDetails({ ...details, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={details.duration}
                onChange={(e) => setDetails({ ...details, duration: e.target.value })}
                placeholder="45"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Ceremony Location</Label>
              <Input
                value={details.location}
                onChange={(e) => setDetails({ ...details, location: e.target.value })}
                placeholder="St. Mary's Church, 123 Church St"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Dress Code</Label>
              <Input
                value={details.dresscode}
                onChange={(e) => setDetails({ ...details, dresscode: e.target.value })}
                placeholder="Black Tie, Cocktail Attire, etc."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Tab */}
      {activeTab === "program" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl">Ceremony Program</CardTitle>
              <Button size="sm" variant="outline" onClick={addProgramItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {programItems.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground pt-1">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-mono w-5">{index + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    value={item.title}
                    onChange={(e) =>
                      setProgramItems(
                        programItems.map((p) =>
                          p.id === item.id ? { ...p, title: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Section title"
                  />
                  <Input
                    value={item.notes}
                    onChange={(e) =>
                      setProgramItems(
                        programItems.map((p) =>
                          p.id === item.id ? { ...p, notes: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Notes (optional)"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeProgramItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vows Tab */}
      {activeTab === "vows" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Partner 1&apos;s Vows</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={vows.partnerOne}
                onChange={(e) => setVows({ ...vows, partnerOne: e.target.value })}
                placeholder="Write your vows here... This is just for planning — no one can see it but you."
                rows={12}
                className="font-serif text-base leading-relaxed"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Partner 2&apos;s Vows</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={vows.partnerTwo}
                onChange={(e) => setVows({ ...vows, partnerTwo: e.target.value })}
                placeholder="Write your vows here..."
                rows={12}
                className="font-serif text-base leading-relaxed"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Music Tab */}
      {activeTab === "music" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Ceremony Music</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "prelude" as const, label: "Prelude Music", placeholder: "Pachelbel Canon in D" },
              { key: "processional" as const, label: "Processional (Walking In)", placeholder: "Here Comes the Sun" },
              { key: "duringCeremony" as const, label: "During Ceremony", placeholder: "Various pieces..." },
              { key: "recessional" as const, label: "Recessional (Walking Out)", placeholder: "Ode to Joy" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={music[key]}
                  onChange={(e) => setMusic({ ...music, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processional Order Tab */}
      {activeTab === "processional" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl">Processional Order</CardTitle>
              <Button size="sm" variant="outline" onClick={addProcessionalPerson}>
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {processionalOrder.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Add people to your processional order</p>
              </div>
            ) : (
              processionalOrder.map((person, index) => (
                <div key={person.id} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-5 font-mono">{index + 1}</span>
                  <Input
                    value={person.name}
                    onChange={(e) =>
                      setProcessionalOrder(
                        processionalOrder.map((p) =>
                          p.id === person.id ? { ...p, name: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Name"
                    className="flex-1"
                  />
                  <Input
                    value={person.role}
                    onChange={(e) =>
                      setProcessionalOrder(
                        processionalOrder.map((p) =>
                          p.id === person.id ? { ...p, role: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Role (e.g., Maid of Honor)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProcessionalPerson(person.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
