"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveReception } from "./actions"
import {
  MapPin,
  Clock,
  Utensils,
  Music,
  Mic,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react"

const TABS = [
  { id: "details", label: "Details", icon: MapPin },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "music", label: "Music & Dance", icon: Music },
  { id: "speeches", label: "Speeches", icon: Mic },
]

type TimelineEvent = { id: string; time: string; event: string; duration: string; notes: string }
type MenuItem = { id: string; name: string }
type Speech = { id: string; name: string; relation: string; duration: string }

export default function ReceptionPage() {
  const [activeTab, setActiveTab] = useState("details")
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [weddingId, setWeddingId] = useState("")

  const [details, setDetails] = useState({
    location: "",
    startTime: "",
    endTime: "",
    cocktailHourStart: "",
    cocktailHourEnd: "",
    notes: "",
  })

  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: "t1", time: "5:00 PM", event: "Cocktail Hour", duration: "60", notes: "" },
    { id: "t2", time: "6:00 PM", event: "Grand Entrance", duration: "15", notes: "" },
    { id: "t3", time: "6:15 PM", event: "First Dance", duration: "5", notes: "" },
    { id: "t4", time: "6:30 PM", event: "Dinner Service", duration: "90", notes: "" },
    { id: "t5", time: "8:00 PM", event: "Cake Cutting", duration: "15", notes: "" },
    { id: "t6", time: "8:15 PM", event: "Open Dancing", duration: "90", notes: "" },
    { id: "t7", time: "10:00 PM", event: "Last Dance & Sendoff", duration: "15", notes: "" },
  ])

  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({
    appetizers: [],
    salads: [],
    entrees: [],
    desserts: [],
  })

  const [musicDance, setMusicDance] = useState({
    firstDanceSong: "",
    firstDanceArtist: "",
    parentDances: "",
    mustPlay: "",
    doNotPlay: "",
  })

  const [speeches, setSpeeches] = useState<Speech[]>([])

  useEffect(() => {
    fetch("/api/reception")
      .then((r) => r.json())
      .then((data) => {
        setWeddingId(data.weddingId ?? "")
        if (data.reception) {
          const r = data.reception
          setDetails({
            location: r.location ?? "",
            startTime: r.startTime ? new Date(r.startTime).toISOString().slice(0, 16) : "",
            endTime: r.endTime ? new Date(r.endTime).toISOString().slice(0, 16) : "",
            cocktailHourStart: r.cocktailHourStart ? new Date(r.cocktailHourStart).toISOString().slice(0, 16) : "",
            cocktailHourEnd: r.cocktailHourEnd ? new Date(r.cocktailHourEnd).toISOString().slice(0, 16) : "",
            notes: r.notes ?? "",
          })
          if (r.eventTimeline) { try { setTimeline(JSON.parse(r.eventTimeline)) } catch {} }
          if (r.menu) { try { setMenu(JSON.parse(r.menu)) } catch {} }
          if (r.speeches) { try { setSpeeches(JSON.parse(r.speeches)) } catch {} }
          if (r.firstDanceSong || r.firstDanceArtist || r.parentDances || r.playlist) {
            try {
              const playlist = r.playlist ? JSON.parse(r.playlist) : {}
              setMusicDance({
                firstDanceSong: r.firstDanceSong ?? "",
                firstDanceArtist: r.firstDanceArtist ?? "",
                parentDances: r.parentDances ?? "",
                mustPlay: playlist.mustPlay ?? "",
                doNotPlay: playlist.doNotPlay ?? "",
              })
            } catch {}
          }
        }
        setInitialLoad(false)
      })
      .catch(() => setInitialLoad(false))
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await saveReception(weddingId, {
        location: details.location || undefined,
        startTime: details.startTime || undefined,
        endTime: details.endTime || undefined,
        cocktailHourStart: details.cocktailHourStart || undefined,
        cocktailHourEnd: details.cocktailHourEnd || undefined,
        notes: details.notes || undefined,
        eventTimeline: JSON.stringify(timeline),
        menu: JSON.stringify(menu),
        firstDanceSong: musicDance.firstDanceSong || undefined,
        firstDanceArtist: musicDance.firstDanceArtist || undefined,
        parentDances: musicDance.parentDances || undefined,
        playlist: JSON.stringify({ mustPlay: musicDance.mustPlay, doNotPlay: musicDance.doNotPlay }),
        speeches: JSON.stringify(speeches),
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Reception details saved!")
    } finally {
      setLoading(false)
    }
  }

  function addTimelineEvent() {
    setTimeline([...timeline, { id: `t-${Date.now()}`, time: "", event: "", duration: "", notes: "" }])
  }

  function addMenuItem(section: string) {
    setMenu({
      ...menu,
      [section]: [...(menu[section] ?? []), { id: `m-${Date.now()}`, name: "" }],
    })
  }

  function removeMenuItem(section: string, id: string) {
    setMenu({ ...menu, [section]: menu[section].filter((i) => i.id !== id) })
  }

  function addSpeech() {
    setSpeeches([...speeches, { id: `s-${Date.now()}`, name: "", relation: "", duration: "" }])
  }

  if (initialLoad) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">Reception Planning</h1>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Reception Planning</h1>
          <p className="text-muted-foreground mt-1">Plan your perfect reception celebration</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="sm:shrink-0">
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

      {/* Details */}
      {activeTab === "details" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Reception Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Venue / Location</Label>
              <Input
                value={details.location}
                onChange={(e) => setDetails({ ...details, location: e.target.value })}
                placeholder="The Grand Ballroom, 123 Main St"
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
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={details.endTime}
                onChange={(e) => setDetails({ ...details, endTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cocktail Hour Start</Label>
              <Input
                type="datetime-local"
                value={details.cocktailHourStart}
                onChange={(e) => setDetails({ ...details, cocktailHourStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cocktail Hour End</Label>
              <Input
                type="datetime-local"
                value={details.cocktailHourEnd}
                onChange={(e) => setDetails({ ...details, cocktailHourEnd: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={details.notes}
                onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                rows={3}
                placeholder="Any additional details..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {activeTab === "timeline" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl">Event Timeline</CardTitle>
              <Button size="sm" variant="outline" onClick={addTimelineEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground pt-1">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-mono w-4">{index + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    value={event.time}
                    onChange={(e) =>
                      setTimeline(timeline.map((t) => t.id === event.id ? { ...t, time: e.target.value } : t))
                    }
                    placeholder="6:00 PM"
                    className="col-span-1"
                  />
                  <Input
                    value={event.event}
                    onChange={(e) =>
                      setTimeline(timeline.map((t) => t.id === event.id ? { ...t, event: e.target.value } : t))
                    }
                    placeholder="First Dance"
                    className="col-span-2"
                  />
                  <Input
                    value={event.duration}
                    onChange={(e) =>
                      setTimeline(timeline.map((t) => t.id === event.id ? { ...t, duration: e.target.value } : t))
                    }
                    placeholder="mins"
                    className="col-span-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setTimeline(timeline.filter((t) => t.id !== event.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Menu */}
      {activeTab === "menu" && (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries({
            appetizers: "🥗 Appetizers",
            salads: "🥙 Salads",
            entrees: "🍽️ Entrees",
            desserts: "🍰 Desserts",
          }).map(([section, label]) => (
            <Card key={section}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{label}</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => addMenuItem(section)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(menu[section] ?? []).map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        setMenu({
                          ...menu,
                          [section]: menu[section].map((m) =>
                            m.id === item.id ? { ...m, name: e.target.value } : m
                          ),
                        })
                      }
                      placeholder="Menu item..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMenuItem(section, item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(menu[section] ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">No items yet</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Music & Dance */}
      {activeTab === "music" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Music & Dancing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Dance Song</Label>
                <Input
                  value={musicDance.firstDanceSong}
                  onChange={(e) => setMusicDance({ ...musicDance, firstDanceSong: e.target.value })}
                  placeholder="Perfect by Ed Sheeran"
                />
              </div>
              <div className="space-y-2">
                <Label>First Dance Artist</Label>
                <Input
                  value={musicDance.firstDanceArtist}
                  onChange={(e) => setMusicDance({ ...musicDance, firstDanceArtist: e.target.value })}
                  placeholder="Ed Sheeran"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parent Dances</Label>
              <Textarea
                value={musicDance.parentDances}
                onChange={(e) => setMusicDance({ ...musicDance, parentDances: e.target.value })}
                placeholder="Mother/Son: My Wish - Rascal Flatts&#10;Father/Daughter: My Girl - The Temptations"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Must-Play List</Label>
              <Textarea
                value={musicDance.mustPlay}
                onChange={(e) => setMusicDance({ ...musicDance, mustPlay: e.target.value })}
                placeholder="One song per line..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Do-Not-Play List</Label>
              <Textarea
                value={musicDance.doNotPlay}
                onChange={(e) => setMusicDance({ ...musicDance, doNotPlay: e.target.value })}
                placeholder="Songs to avoid..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speeches */}
      {activeTab === "speeches" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl">Speeches & Toasts</CardTitle>
              <Button size="sm" variant="outline" onClick={addSpeech}>
                <Plus className="h-4 w-4 mr-2" />
                Add Speaker
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {speeches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Add speakers for your reception toasts</p>
              </div>
            ) : (
              speeches.map((speech, index) => (
                <div key={speech.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground w-5 font-mono">{index + 1}</span>
                  <Input
                    value={speech.name}
                    onChange={(e) =>
                      setSpeeches(speeches.map((s) => s.id === speech.id ? { ...s, name: e.target.value } : s))
                    }
                    placeholder="Speaker name"
                    className="flex-1"
                  />
                  <Input
                    value={speech.relation}
                    onChange={(e) =>
                      setSpeeches(speeches.map((s) => s.id === speech.id ? { ...s, relation: e.target.value } : s))
                    }
                    placeholder="Best Man, MOH..."
                    className="flex-1"
                  />
                  <Input
                    value={speech.duration}
                    onChange={(e) =>
                      setSpeeches(speeches.map((s) => s.id === speech.id ? { ...s, duration: e.target.value } : s))
                    }
                    placeholder="5 min"
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setSpeeches(speeches.filter((s) => s.id !== speech.id))}
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
