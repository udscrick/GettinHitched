"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pin, PinOff, Plus, Trash2, StickyNote } from "lucide-react"

const CATEGORIES = ["general", "vendor", "ceremony", "reception", "guests", "budget", "other"]

type Note = {
  id: string
  title: string | null
  content: string
  category: string
  isPinned: boolean
  createdAt: string
  user?: { name: string | null; image: string | null }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filter, setFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: "", content: "", category: "general" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/notes").then((r) => r.json()).then((data) => {
      if (data.notes) setNotes(data.notes)
    })
  }, [])

  async function handleSubmit() {
    if (!form.content.trim()) { toast.error("Note content is required"); return }
    setLoading(true)
    try {
      const url = editNote ? `/api/notes/${editNote.id}` : "/api/notes"
      const method = editNote ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      if (editNote) {
        setNotes(notes.map((n) => n.id === editNote.id ? data.note : n))
        toast.success("Note updated!")
      } else {
        setNotes([data.note, ...notes])
        toast.success("Note added!")
      }
      setOpen(false)
      setEditNote(null)
      setForm({ title: "", content: "", category: "general" })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setNotes(notes.filter((n) => n.id !== id))
    toast.success("Note deleted")
  }

  async function handleTogglePin(note: Note) {
    const res = await fetch(`/api/notes/${note.id}/pin`, { method: "POST" })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setNotes(notes.map((n) => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n).sort(
      (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
    ))
  }

  function openEdit(note: Note) {
    setEditNote(note)
    setForm({ title: note.title ?? "", content: note.content, category: note.category })
    setOpen(true)
  }

  const filtered = filter === "all"
    ? notes
    : notes.filter((n) => n.category === filter)

  const categoryColors: Record<string, string> = {
    general: "bg-gray-100 text-gray-700",
    vendor: "bg-blue-100 text-blue-700",
    ceremony: "bg-pink-100 text-pink-700",
    reception: "bg-purple-100 text-purple-700",
    guests: "bg-green-100 text-green-700",
    budget: "bg-amber-100 text-amber-700",
    other: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-1">Shared notes for your wedding planning team</p>
        </div>
        <Button onClick={() => { setEditNote(null); setForm({ title: "", content: "", category: "general" }); setOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({notes.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = notes.filter((n) => n.category === cat).length
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No notes yet</p>
          <p className="text-sm mt-1">Create notes to share ideas with your planning team</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className={`relative cursor-pointer hover:shadow-md transition-shadow ${
                note.isPinned ? "border-primary/50 bg-primary/5" : ""
              }`}
              onClick={() => openEdit(note)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {note.title && (
                      <CardTitle className="text-base font-semibold truncate">{note.title}</CardTitle>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 capitalize ${categoryColors[note.category] ?? categoryColors.other}`}>
                      {note.category}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePin(note)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                    >
                      {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  {new Date(note.createdAt).toLocaleDateString()}
                  {note.user?.name && ` · ${note.user.name}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editNote ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Note title..."
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1 rounded-full text-xs capitalize transition-colors border ${
                      form.category === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your note here..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editNote ? "Update" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
