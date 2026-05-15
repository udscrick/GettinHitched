"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, Calendar, Users, CheckSquare, ShoppingBag, Pencil, Trash2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createEvent, updateEvent, deleteEvent } from "@/actions/events"
import { EVENT_TYPES } from "@/lib/constants/events"

type EventWithCounts = {
  id: string
  name: string
  type: string
  date: Date | null
  startTime: string | null
  endTime: string | null
  location: string | null
  description: string | null
  _count: { guests: number; tasks: number; vendors: number }
}

type Props = {
  events: EventWithCounts[]
  weddingId: string
  partnerOneName: string
  partnerTwoName: string
  role: string
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  ROKA: "bg-amber-100 text-amber-800",
  ENGAGEMENT: "bg-pink-100 text-pink-800",
  MEHENDI: "bg-green-100 text-green-800",
  HALDI: "bg-yellow-100 text-yellow-800",
  SANGEET: "bg-purple-100 text-purple-800",
  TILAK: "bg-orange-100 text-orange-800",
  BARAAT: "bg-red-100 text-red-800",
  WEDDING_CEREMONY: "bg-rose-100 text-rose-800",
  RECEPTION: "bg-blue-100 text-blue-800",
  GRIHA_PRAVESH: "bg-teal-100 text-teal-800",
  CUSTOM: "bg-gray-100 text-gray-800",
}

const emptyForm = { name: "", type: "CUSTOM", date: "", startTime: "", endTime: "", location: "", description: "" }

export function EventsClient({ events, weddingId, partnerOneName, partnerTwoName, role }: Props) {
  const router = useRouter()
  const [localEvents, setLocalEvents] = useState(events)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithCounts | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const canEdit = role !== "VIEWER"

  function openCreate() {
    setEditingEvent(null)
    setForm(emptyForm)
    setShowDialog(true)
  }

  function openEdit(ev: EventWithCounts) {
    setEditingEvent(ev)
    setForm({
      name: ev.name,
      type: ev.type,
      date: ev.date ? format(new Date(ev.date), "yyyy-MM-dd") : "",
      startTime: ev.startTime ?? "",
      endTime: ev.endTime ?? "",
      location: ev.location ?? "",
      description: ev.description ?? "",
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Event name is required")
    setLoading(true)
    try {
      if (editingEvent) {
        const res = await updateEvent(editingEvent.id, form)
        if (res.error) return toast.error(res.error)
        setLocalEvents(localEvents.map(e => e.id === editingEvent.id ? { ...e, ...res.event! } : e))
        toast.success("Event updated")
      } else {
        const res = await createEvent(weddingId, form)
        if (res.error) return toast.error(res.error)
        setLocalEvents([...localEvents, { ...res.event!, _count: { guests: 0, tasks: 0, vendors: 0 } }])
        toast.success("Event created")
      }
      setShowDialog(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    try {
      const res = await deleteEvent(id)
      if (res.error) return toast.error(res.error)
      setLocalEvents(localEvents.filter(e => e.id !== id))
      setDeleteId(null)
      toast.success("Event deleted")
    } finally {
      setLoading(false)
    }
  }

  const typeLabel = (type: string) => EVENT_TYPES.find(t => t.value === type)?.label ?? type

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">
            {partnerOneName} &amp; {partnerTwoName} — all functions and celebrations
          </p>
        </div>
        {canEdit && (
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {localEvents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first event — Mehendi, Sangeet, Wedding Ceremony, Reception, and more.
          </p>
          {canEdit && (
            <Button variant="gold" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {localEvents.map(ev => (
            <Card
              key={ev.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{ borderLeftColor: "#C9A96E" }}
              onClick={() => router.push(`/events/${ev.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[ev.type] ?? EVENT_TYPE_COLORS.CUSTOM}`}>
                        {typeLabel(ev.type)}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-serif truncate">{ev.name}</CardTitle>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ev)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(ev.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ev.date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {format(new Date(ev.date), "d MMM yyyy")}
                      {ev.startTime && ` · ${ev.startTime}`}
                      {ev.endTime && ` – ${ev.endTime}`}
                    </span>
                  </div>
                )}
                {ev.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                )}
                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{ev._count.guests} guests</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>{ev._count.tasks} tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{ev._count.vendors} vendors</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Event Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Event Name *</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Sharma Family Sangeet"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  className="mt-1"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Location / Venue</Label>
              <Input
                className="mt-1"
                placeholder="Venue name or address"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                className="mt-1"
                placeholder="Brief description (optional)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleSave} disabled={loading}>
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete the event and all its guests, budget, vendors, and tasks. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={loading}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
