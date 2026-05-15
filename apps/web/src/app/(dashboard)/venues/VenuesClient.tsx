"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useWedding } from "@/contexts/WeddingContext"
import { formatCurrency } from "@/lib/utils"
import { createVenue, updateVenue, deleteVenue, updateVenueStatus } from "@/actions/venues"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building2, Plus, MoreHorizontal, Pencil, Trash2, Star, MapPin, Users, Phone, Mail, Globe, PlusCircle, X, Receipt, FileText } from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RESEARCHING: { label: "Researching", className: "bg-gray-100 text-gray-700" },
  TOURED: { label: "Toured", className: "bg-blue-100 text-blue-800" },
  CONSIDERING: { label: "Considering", className: "bg-yellow-100 text-yellow-800" },
  BOOKED: { label: "Booked!", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
}

interface CostItem {
  id: string
  label: string
  amount: string
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
  costItems: string | null
  contractUrl: string | null
  photoUrls: string | null
  depositPaid: boolean
  depositAmount: string | null
  visitDate: Date | null
  bookingDate: Date | null
}

interface Props {
  eventId: string
  venues: Venue[]
  role: string
}

const defaultForm = {
  name: "", status: "RESEARCHING", address: "", city: "", state: "",
  website: "", contactPerson: "", email: "", phone: "", capacity: "",
  cateringType: "", parkingAvailable: false,
  notes: "", pros: "", cons: "", rating: "",
  contractUrl: "", depositPaid: false, depositAmount: "",
  visitDate: "", bookingDate: "",
}

function parseCostItems(raw: string | null): CostItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.map((item: { label: string; amount: string }, i: number) => ({ id: String(i), label: item.label ?? "", amount: item.amount ?? "" }))
      : []
  } catch { return [] }
}

function parsePhotoUrls(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((u: unknown) => typeof u === "string" && u) : []
  } catch { return [] }
}

function sumCostItems(items: CostItem[]): number {
  return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
}

export function VenuesClient({ eventId, venues: initialVenues, role }: Props) {
  const { wedding } = useWedding()
  const currency = wedding?.currency ?? "INR"
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>(initialVenues)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editVenue, setEditVenue] = useState<Venue | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [activeTab, setActiveTab] = useState<"basics" | "costs" | "docs">("basics")
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [photoUrlsList, setPhotoUrlsList] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")

  const canEdit = role !== "VIEWER"
  const filtered = venues.filter(v => filterStatus === "ALL" || v.status === filterStatus)
  const costTotal = sumCostItems(costItems)

  function openAdd() {
    setEditVenue(null)
    setForm(defaultForm)
    setCostItems([])
    setPhotoUrlsList([])
    setActiveTab("basics")
    setDialogOpen(true)
  }

  function openEdit(venue: Venue) {
    setEditVenue(venue)
    setForm({
      name: venue.name, status: venue.status,
      address: venue.address ?? "", city: venue.city ?? "", state: venue.state ?? "",
      website: venue.website ?? "", contactPerson: venue.contactPerson ?? "",
      email: venue.email ?? "", phone: venue.phone ?? "",
      capacity: venue.capacity?.toString() ?? "",
      cateringType: venue.cateringType ?? "", parkingAvailable: venue.parkingAvailable,
      notes: venue.notes ?? "", pros: venue.pros ?? "", cons: venue.cons ?? "",
      rating: venue.rating?.toString() ?? "",
      contractUrl: venue.contractUrl ?? "",
      depositPaid: venue.depositPaid,
      depositAmount: venue.depositAmount ?? "",
      visitDate: venue.visitDate ? new Date(venue.visitDate).toISOString().split("T")[0] : "",
      bookingDate: venue.bookingDate ? new Date(venue.bookingDate).toISOString().split("T")[0] : "",
    })
    setCostItems(parseCostItems(venue.costItems))
    setPhotoUrlsList(parsePhotoUrls(venue.photoUrls))
    setActiveTab("basics")
    setDialogOpen(true)
  }

  function addCostItem() {
    setCostItems(prev => [...prev, { id: Date.now().toString(), label: "", amount: "" }])
  }

  function updateCostItem(id: string, field: "label" | "amount", value: string) {
    setCostItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function removeCostItem(id: string) {
    setCostItems(prev => prev.filter(item => item.id !== id))
  }

  function addPhotoUrl() {
    setPhotoUrlsList(prev => [...prev, ""])
  }

  function updatePhotoUrl(index: number, value: string) {
    setPhotoUrlsList(prev => prev.map((u, i) => i === index ? value : u))
  }

  function removePhotoUrl(index: number) {
    setPhotoUrlsList(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!form.name) { toast.error("Venue name is required"); return }
    setSaving(true)
    try {
      const validCostItems = costItems.filter(i => i.label || i.amount)
      const costItemsJson = validCostItems.length > 0
        ? JSON.stringify(validCostItems.map(i => ({ label: i.label, amount: i.amount })))
        : undefined
      const photoUrlsJson = photoUrlsList.filter(Boolean).length > 0
        ? JSON.stringify(photoUrlsList.filter(Boolean))
        : undefined
      const computedTotal = sumCostItems(validCostItems)

      const actionData = {
        name: form.name, status: form.status,
        address: form.address || undefined, city: form.city || undefined, state: form.state || undefined,
        website: form.website || undefined, contactPerson: form.contactPerson || undefined,
        email: form.email || undefined, phone: form.phone || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        cateringType: form.cateringType || undefined, parkingAvailable: form.parkingAvailable,
        notes: form.notes || undefined, pros: form.pros || undefined,
        cons: form.cons || undefined, rating: form.rating ? parseInt(form.rating) : undefined,
        costItems: costItemsJson,
        contractUrl: form.contractUrl || undefined,
        photoUrls: photoUrlsJson,
        depositPaid: form.depositPaid,
        depositAmount: form.depositAmount || undefined,
        visitDate: form.visitDate || undefined,
        bookingDate: form.bookingDate || undefined,
        rentalFeeMin: computedTotal > 0 ? String(computedTotal) : undefined,
      }

      const stateVenue: Venue = {
        id: editVenue?.id ?? "",
        name: form.name, status: form.status,
        address: form.address || null, city: form.city || null, state: form.state || null,
        website: form.website || null, contactPerson: form.contactPerson || null,
        email: form.email || null, phone: form.phone || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        rentalFeeMin: computedTotal > 0 ? String(computedTotal) : null,
        rentalFeeMax: null,
        cateringType: form.cateringType || null, parkingAvailable: form.parkingAvailable,
        notes: form.notes || null, pros: form.pros || null,
        cons: form.cons || null, rating: form.rating ? parseInt(form.rating) : null,
        costItems: costItemsJson ?? null,
        contractUrl: form.contractUrl || null,
        photoUrls: photoUrlsJson ?? null,
        depositPaid: form.depositPaid,
        depositAmount: form.depositAmount || null,
        visitDate: form.visitDate ? new Date(form.visitDate) : null,
        bookingDate: form.bookingDate ? new Date(form.bookingDate) : null,
      }

      if (editVenue) {
        const res = await updateVenue(editVenue.id, eventId, actionData)
        if (res.error) { toast.error(res.error); return }
        setVenues(vs => vs.map(v => v.id === editVenue.id ? stateVenue : v))
        toast.success("Venue updated!")
      } else {
        const res = await createVenue(eventId, actionData)
        if (res.error) { toast.error(res.error); return }
        setVenues(vs => [...vs, { ...stateVenue, id: (res.venue as { id: string }).id }])
        toast.success("Venue added!")
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteVenue(id, eventId)
    if (res.error) { toast.error(res.error); return }
    setVenues(vs => vs.filter(v => v.id !== id))
    setDeleteId(null)
    toast.success("Venue removed")
  }

  async function handleStatusChange(venueId: string, status: string) {
    const res = await updateVenueStatus(venueId, eventId, status)
    if (res.error) { toast.error(res.error); return }
    setVenues(vs => vs.map(v => v.id === venueId ? { ...v, status } : v))
    toast.success("Status updated")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Venues</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button variant="gold" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Venue
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
              <p className="text-muted-foreground text-sm mt-1">Add venues to research and compare</p>
            </div>
            {canEdit && (
              <Button variant="gold" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />Add First Venue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(venue => {
            const statusCfg = STATUS_CONFIG[venue.status] ?? STATUS_CONFIG.RESEARCHING
            const items = parseCostItems(venue.costItems)
            const total = sumCostItems(items)
            return (
              <Card key={venue.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{venue.name}</CardTitle>
                      {(venue.city || venue.state) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{[venue.city, venue.state].filter(Boolean).join(", ")}</span>
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
                          {["TOURED", "CONSIDERING", "BOOKED", "REJECTED"].map(s => (
                            <DropdownMenuItem key={s} onClick={() => handleStatusChange(venue.id, s)}>
                              Mark as {STATUS_CONFIG[s]?.label ?? s}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(venue.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 pt-0">
                  <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
                  <div className="space-y-1.5 text-sm">
                    {venue.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>Up to {venue.capacity} guests</span>
                      </div>
                    )}
                    {total > 0 && (
                      <div>
                        <p className="font-semibold text-sm">{formatCurrency(total, currency)} total</p>
                        {items.length > 1 && (
                          <p className="text-xs text-muted-foreground">{items.length} cost items</p>
                        )}
                      </div>
                    )}
                    {!total && (venue.rentalFeeMin || venue.rentalFeeMax) && (
                      <p className="font-medium text-sm">
                        {formatCurrency(venue.rentalFeeMin ?? 0, currency)}
                        {venue.rentalFeeMax ? ` – ${formatCurrency(venue.rentalFeeMax, currency)}` : "+"}
                      </p>
                    )}
                    {venue.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /><span className="truncate">{venue.email}</span>
                      </div>
                    )}
                    {venue.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /><span>{venue.phone}</span>
                      </div>
                    )}
                    {venue.website && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground truncate">Website</a>
                      </div>
                    )}
                  </div>
                  {venue.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`h-3.5 w-3.5 ${n <= venue.rating! ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                      ))}
                    </div>
                  )}
                  {venue.parkingAvailable && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">🚗 Parking Available</Badge>
                  )}
                  {venue.contractUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <a href={venue.contractUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Contract / Doc</a>
                    </div>
                  )}
                  {venue.pros && <div><p className="text-xs font-medium text-green-700">Pros:</p><p className="text-xs text-muted-foreground">{venue.pros}</p></div>}
                  {venue.cons && <div><p className="text-xs font-medium text-red-700">Cons:</p><p className="text-xs text-muted-foreground">{venue.cons}</p></div>}
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
            <DialogTitle className="font-serif">{editVenue ? "Edit Venue" : "Add Venue"}</DialogTitle>
          </DialogHeader>

          {/* Tab navigation */}
          <div className="flex border-b gap-1 -mx-1 px-1">
            {(["basics", "costs", "docs"] as const).map(tab => {
              const labels = { basics: "Details", costs: "Costs", docs: "Documents" }
              const icons = {
                basics: <Building2 className="h-3.5 w-3.5" />,
                costs: <Receipt className="h-3.5 w-3.5" />,
                docs: <FileText className="h-3.5 w-3.5" />,
              }
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? "border-champagne-gold text-champagne-gold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {icons[tab]}{labels[tab]}
                  {tab === "costs" && costItems.length > 0 && (
                    <span className="ml-1 bg-champagne-gold text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {costItems.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="py-4">
            {/* ── DETAILS TAB ── */}
            {activeTab === "basics" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Venue Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="The Grand Ballroom" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="200" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 MG Road" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Maharashtra" />
                </div>
                <div className="space-y-2">
                  <Label>Catering Type</Label>
                  <Select value={form.cateringType || "none"} onValueChange={v => setForm({ ...form, cateringType: v === "none" ? "" : v })}>
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
                  <Label>Contact Person</Label>
                  <Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Ramesh Sharma" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="venue@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://venue.com" />
                </div>
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Select value={form.rating || "none"} onValueChange={v => setForm({ ...form, rating: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="No rating" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No rating</SelectItem>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{"⭐".repeat(n)} {n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="parking" checked={form.parkingAvailable} onChange={e => setForm({ ...form, parkingAvailable: e.target.checked })} className="rounded" />
                  <Label htmlFor="parking">Parking Available</Label>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Pros</Label>
                  <Textarea value={form.pros} onChange={e => setForm({ ...form, pros: e.target.value })} placeholder="What do you love about this venue?" rows={2} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Cons</Label>
                  <Textarea value={form.cons} onChange={e => setForm({ ...form, cons: e.target.value })} placeholder="Any drawbacks?" rows={2} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
                </div>
              </div>
            )}

            {/* ── COSTS TAB ── */}
            {activeTab === "costs" && (
              <div className="space-y-5">
                {/* Line items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Cost Breakdown</p>
                      <p className="text-xs text-muted-foreground">Add individual cost items — total updates automatically</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCostItem}>
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Add Item
                    </Button>
                  </div>

                  {costItems.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No cost items yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Click "Add Item" to break down the venue cost</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={addCostItem}>
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Add First Item
                      </Button>
                    </div>
                  )}

                  {costItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_160px_32px] gap-2 px-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount ({currency})</p>
                        <span />
                      </div>
                      {costItems.map(item => (
                        <div key={item.id} className="grid grid-cols-[1fr_160px_32px] gap-2 items-center">
                          <Input
                            value={item.label}
                            onChange={e => updateCostItem(item.id, "label", e.target.value)}
                            placeholder="e.g. Hall Rental, Per Plate, DJ…"
                          />
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={e => updateCostItem(item.id, "amount", e.target.value)}
                            placeholder="0"
                          />
                          <button
                            onClick={() => removeCostItem(item.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {costItems.length > 0 && (
                    <div className="flex justify-end border-t pt-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-champagne-gold">{formatCurrency(costTotal, currency)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deposit */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Deposit</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Deposit Amount ({currency})</Label>
                      <Input
                        type="number"
                        value={form.depositAmount}
                        onChange={e => setForm({ ...form, depositAmount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="depositPaid"
                        checked={form.depositPaid}
                        onChange={e => setForm({ ...form, depositPaid: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="depositPaid">Deposit Paid</Label>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Dates</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Visit / Tour Date</Label>
                      <Input type="date" value={form.visitDate} onChange={e => setForm({ ...form, visitDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Booking Date</Label>
                      <Input type="date" value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === "docs" && (
              <div className="space-y-5">
                {/* Contract */}
                <div className="space-y-2">
                  <Label>Contract / Agreement URL</Label>
                  <p className="text-xs text-muted-foreground">Paste a link to a Google Drive, Dropbox, or any hosted document</p>
                  <Input
                    value={form.contractUrl}
                    onChange={e => setForm({ ...form, contractUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                  {form.contractUrl && (
                    <a href={form.contractUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-champagne-gold hover:underline mt-1">
                      <FileText className="h-3 w-3" />Open contract
                    </a>
                  )}
                </div>

                {/* Photos / docs */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Photos & Documents</p>
                      <p className="text-xs text-muted-foreground">Add links to venue photos, floor plans, brochures, etc.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addPhotoUrl}>
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Add Link
                    </Button>
                  </div>

                  {photoUrlsList.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No photos or documents yet</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={addPhotoUrl}>
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Add Link
                      </Button>
                    </div>
                  )}

                  {photoUrlsList.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={url}
                        onChange={e => updatePhotoUrl(i, e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="flex-1"
                      />
                      <button
                        onClick={() => removePhotoUrl(i)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editVenue ? "Update Venue" : "Add Venue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Venue</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete Venue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
