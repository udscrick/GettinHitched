"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createVenue, updateVenue, deleteVenue, updateVenueStatus } from "@/actions/venues"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  MapPin,
  Users,
  Phone,
  Mail,
  Globe,
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; className: string; next?: string }> = {
  RESEARCHING: { label: "Researching", className: "bg-gray-100 text-gray-700", next: "TOURED" },
  TOURED: { label: "Toured", className: "bg-blue-100 text-blue-800", next: "CONSIDERING" },
  CONSIDERING: { label: "Considering", className: "bg-yellow-100 text-yellow-800", next: "BOOKED" },
  BOOKED: { label: "Booked!", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
}

interface Venue {
  id: string
  name: string
  status: string
  address: string | null
  city: string | null
  state: string | null
  website: string | null
  contactPerson: string | null
  email: string | null
  phone: string | null
  capacity: number | null
  rentalFeeMin: string | null
  rentalFeeMax: string | null
  cateringType: string | null
  parkingAvailable: boolean
  notes: string | null
  pros: string | null
  cons: string | null
  rating: number | null
}

const defaultForm = {
  name: "",
  status: "RESEARCHING",
  address: "",
  city: "",
  state: "",
  website: "",
  contactPerson: "",
  email: "",
  phone: "",
  capacity: "",
  rentalFeeMin: "",
  rentalFeeMax: "",
  cateringType: "",
  parkingAvailable: false,
  notes: "",
  pros: "",
  cons: "",
  rating: "",
}

// This page uses client-side data fetching after initial load
export default function VenuesPage() {
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>([])
  const [weddingId, setWeddingId] = useState("")
  const [role, setRole] = useState("OWNER")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editVenue, setEditVenue] = useState<Venue | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data) => {
        setVenues(data.venues ?? [])
        setWeddingId(data.weddingId ?? "")
        setRole(data.role ?? "OWNER")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const canEdit = role !== "VIEWER"
  const filtered = venues.filter((v) => filterStatus === "ALL" || v.status === filterStatus)

  function openAdd() {
    setEditVenue(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(venue: Venue) {
    setEditVenue(venue)
    setForm({
      name: venue.name,
      status: venue.status,
      address: venue.address ?? "",
      city: venue.city ?? "",
      state: venue.state ?? "",
      website: venue.website ?? "",
      contactPerson: venue.contactPerson ?? "",
      email: venue.email ?? "",
      phone: venue.phone ?? "",
      capacity: venue.capacity?.toString() ?? "",
      rentalFeeMin: venue.rentalFeeMin ?? "",
      rentalFeeMax: venue.rentalFeeMax ?? "",
      cateringType: venue.cateringType ?? "",
      parkingAvailable: venue.parkingAvailable,
      notes: venue.notes ?? "",
      pros: venue.pros ?? "",
      cons: venue.cons ?? "",
      rating: venue.rating?.toString() ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!form.name) { toast.error("Venue name is required"); return }
    setSaving(true)
    try {
      const data = {
        name: form.name,
        status: form.status,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        website: form.website || undefined,
        contactPerson: form.contactPerson || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        rentalFeeMin: form.rentalFeeMin || undefined,
        rentalFeeMax: form.rentalFeeMax || undefined,
        cateringType: form.cateringType || undefined,
        parkingAvailable: form.parkingAvailable,
        notes: form.notes || undefined,
        pros: form.pros || undefined,
        cons: form.cons || undefined,
        rating: form.rating ? parseInt(form.rating) : undefined,
      }
      if (editVenue) {
        const res = await updateVenue(editVenue.id, weddingId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Venue updated!")
      } else {
        const res = await createVenue(weddingId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Venue added!")
      }
      setDialogOpen(false)
      router.refresh()
      // Re-fetch
      const r = await fetch("/api/venues")
      const d = await r.json()
      setVenues(d.venues ?? [])
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteVenue(id, weddingId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Venue removed")
    setDeleteId(null)
    setVenues((v) => v.filter((x) => x.id !== id))
  }

  async function handleStatusChange(venueId: string, status: string) {
    const res = await updateVenueStatus(venueId, weddingId, status)
    if (res.error) { toast.error(res.error); return }
    toast.success("Status updated")
    setVenues((vs) => vs.map((v) => v.id === venueId ? { ...v, status } : v))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-serif text-3xl font-bold">Venues</h1>
          <p className="text-muted-foreground mt-1">Loading venues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Venues</h1>
        <p className="text-muted-foreground mt-1">Research and compare wedding venues</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Venues</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Venue
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">No venues yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Start researching venues for your big day
              </p>
            </div>
            {canEdit && (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Venue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((venue) => {
            const statusCfg = STATUS_CONFIG[venue.status] ?? STATUS_CONFIG.RESEARCHING
            return (
              <Card key={venue.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{venue.name}</CardTitle>
                      {(venue.city || venue.state) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[venue.city, venue.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(venue)}>
                            <Pencil className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(venue.id, "TOURED")}>
                            Mark as Toured
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(venue.id, "CONSIDERING")}>
                            Mark as Considering
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(venue.id, "BOOKED")}>
                            Mark as Booked
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(venue.id, "REJECTED")}>
                            Mark as Rejected
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(venue.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 pt-0">
                  <Badge variant="outline" className={statusCfg.className}>
                    {statusCfg.label}
                  </Badge>

                  <div className="space-y-1.5 text-sm">
                    {venue.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>Up to {venue.capacity} guests</span>
                      </div>
                    )}
                    {(venue.rentalFeeMin || venue.rentalFeeMax) && (
                      <p className="font-medium text-sm">
                        ${venue.rentalFeeMin ?? "?"}
                        {venue.rentalFeeMax ? ` – $${venue.rentalFeeMax}` : "+"}
                      </p>
                    )}
                    {venue.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{venue.email}</span>
                      </div>
                    )}
                    {venue.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{venue.phone}</span>
                      </div>
                    )}
                    {venue.website && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <a
                          href={venue.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground truncate"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {venue.rating && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= venue.rating!
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {venue.parkingAvailable && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      🚗 Parking Available
                    </Badge>
                  )}

                  {venue.pros && (
                    <div>
                      <p className="text-xs font-medium text-green-700">Pros:</p>
                      <p className="text-xs text-muted-foreground">{venue.pros}</p>
                    </div>
                  )}
                  {venue.cons && (
                    <div>
                      <p className="text-xs font-medium text-red-700">Cons:</p>
                      <p className="text-xs text-muted-foreground">{venue.cons}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editVenue ? "Edit Venue" : "Add Venue"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Venue Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="The Grand Ballroom"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="200"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="NY"
              />
            </div>
            <div className="space-y-2">
              <Label>Rental Fee Min ($)</Label>
              <Input
                value={form.rentalFeeMin}
                onChange={(e) => setForm({ ...form, rentalFeeMin: e.target.value })}
                placeholder="5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Rental Fee Max ($)</Label>
              <Input
                value={form.rentalFeeMax}
                onChange={(e) => setForm({ ...form, rentalFeeMax: e.target.value })}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Catering Type</Label>
              <Select
                value={form.cateringType || "none"}
                onValueChange={(v) => setForm({ ...form, cateringType: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="in-house">In-House Only</SelectItem>
                  <SelectItem value="approved-list">Approved List</SelectItem>
                  <SelectItem value="bring-your-own">Bring Your Own</SelectItem>
                  <SelectItem value="not-included">Not Included</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="venue@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 0123"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://venuename.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <Select
                value={form.rating || "none"}
                onValueChange={(v) => setForm({ ...form, rating: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="No rating" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No rating</SelectItem>
                  <SelectItem value="1">⭐ 1</SelectItem>
                  <SelectItem value="2">⭐⭐ 2</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="parking"
                checked={form.parkingAvailable}
                onChange={(e) => setForm({ ...form, parkingAvailable: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="parking">Parking Available</Label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Pros</Label>
              <Textarea
                value={form.pros}
                onChange={(e) => setForm({ ...form, pros: e.target.value })}
                placeholder="What do you love about this venue?"
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Cons</Label>
              <Textarea
                value={form.cons}
                onChange={(e) => setForm({ ...form, cons: e.target.value })}
                placeholder="Any drawbacks or concerns?"
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editVenue ? "Update Venue" : "Add Venue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Venue</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
