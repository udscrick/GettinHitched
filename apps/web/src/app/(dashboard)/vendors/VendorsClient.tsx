"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  createVendor,
  updateVendor,
  deleteVendor,
  addVendorCommunication,
} from "@/actions/vendors"
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
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ShoppingBag,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const VENDOR_TYPES = [
  { value: "PHOTOGRAPHER", label: "Photographer", icon: "📷" },
  { value: "VIDEOGRAPHER", label: "Videographer", icon: "🎥" },
  { value: "CATERER", label: "Caterer", icon: "🍽️" },
  { value: "FLORIST", label: "Florist", icon: "💐" },
  { value: "DJ", label: "DJ", icon: "🎧" },
  { value: "BAND", label: "Live Band", icon: "🎸" },
  { value: "OFFICIANT", label: "Officiant", icon: "⛪" },
  { value: "HAIR_MAKEUP", label: "Hair & Makeup", icon: "💄" },
  { value: "CAKE_BAKER", label: "Cake Baker", icon: "🎂" },
  { value: "TRANSPORTATION", label: "Transportation", icon: "🚗" },
  { value: "PLANNER", label: "Wedding Planner", icon: "📋" },
  { value: "VENUE", label: "Venue", icon: "🏛️" },
  { value: "RENTALS", label: "Rentals", icon: "🪑" },
  { value: "LIGHTING", label: "Lighting", icon: "💡" },
  { value: "STATIONERY", label: "Stationery", icon: "✉️" },
  { value: "JEWELRY", label: "Jewelry", icon: "💍" },
  { value: "DRESS", label: "Dress/Attire", icon: "👗" },
  { value: "CATERING_STAFF", label: "Catering Staff", icon: "👨‍🍳" },
  { value: "SECURITY", label: "Security", icon: "🔒" },
  { value: "OTHER", label: "Other", icon: "📦" },
]

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RESEARCHING: { label: "Researching", className: "bg-gray-100 text-gray-700 border-gray-200" },
  CONTACTED: { label: "Contacted", className: "bg-blue-100 text-blue-800 border-blue-200" },
  BOOKED: { label: "Booked", className: "bg-green-100 text-green-800 border-green-200" },
  CONTRACT_SIGNED: { label: "Contract Signed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  COMPLETED: { label: "Completed", className: "bg-slate-100 text-slate-700 border-slate-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
}

interface Communication {
  id: string
  type: string
  date: Date | string
  summary: string
  followUpDate: Date | string | null
  notes: string | null
}

interface Vendor {
  id: string
  name: string
  type: string
  status: string
  email: string | null
  phone: string | null
  website: string | null
  contactPerson: string | null
  price: string | null
  rating: number | null
  notes: string | null
  communications: Communication[]
}

interface Props {
  weddingId: string
  vendors: Vendor[]
  role: string
}

const defaultForm = {
  name: "",
  type: "PHOTOGRAPHER",
  status: "RESEARCHING",
  email: "",
  phone: "",
  website: "",
  contactPerson: "",
  price: "",
  rating: "",
  notes: "",
}

const defaultCommForm = {
  type: "EMAIL",
  date: new Date().toISOString().split("T")[0],
  summary: "",
  followUpDate: "",
  notes: "",
}

export function VendorsClient({ weddingId, vendors, role }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState("ALL")
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null)
  const [commDialogOpen, setCommDialogOpen] = useState(false)
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null)
  const [commForm, setCommForm] = useState(defaultCommForm)

  const canEdit = role !== "VIEWER"

  const filtered = vendors.filter((v) => filterType === "ALL" || v.type === filterType)

  function getTypeInfo(type: string) {
    return VENDOR_TYPES.find((t) => t.value === type) ?? { icon: "📦", label: type }
  }

  function openAdd() {
    setEditVendor(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(vendor: Vendor) {
    setEditVendor(vendor)
    setForm({
      name: vendor.name,
      type: vendor.type,
      status: vendor.status,
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      website: vendor.website ?? "",
      contactPerson: vendor.contactPerson ?? "",
      price: vendor.price ?? "",
      rating: vendor.rating?.toString() ?? "",
      notes: vendor.notes ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!form.name) { toast.error("Vendor name is required"); return }
    setLoading(true)
    try {
      const data = {
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        contactPerson: form.contactPerson || undefined,
        price: form.price || undefined,
        notes: form.notes || undefined,
        rating: form.rating ? parseInt(form.rating) : undefined,
      }
      if (editVendor) {
        const res = await updateVendor(editVendor.id, weddingId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Vendor updated!")
      } else {
        const res = await createVendor(weddingId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Vendor added!")
      }
      setDialogOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteVendor(id, weddingId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Vendor removed")
    setDeleteId(null)
    router.refresh()
  }

  async function handleAddComm() {
    if (!activeVendorId || !commForm.summary) {
      toast.error("Summary is required")
      return
    }
    setLoading(true)
    try {
      const res = await addVendorCommunication(activeVendorId, weddingId, commForm)
      if (res.error) { toast.error(res.error); return }
      toast.success("Communication logged!")
      setCommDialogOpen(false)
      setCommForm(defaultCommForm)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Vendors</SelectItem>
            {VENDOR_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.icon} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Vendor Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 bg-muted rounded-full">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">No vendors yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Add photographers, caterers, florists and more
              </p>
            </div>
            {canEdit && (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Vendor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => {
            const typeInfo = getTypeInfo(vendor.type)
            const statusCfg = STATUS_CONFIG[vendor.status] ?? STATUS_CONFIG.RESEARCHING
            const isExpanded = expandedVendorId === vendor.id

            return (
              <Card key={vendor.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <div>
                        <CardTitle className="text-base">{vendor.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
                      </div>
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(vendor)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveVendorId(vendor.id)
                              setCommDialogOpen(true)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Log Communication
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(vendor.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

                  {vendor.price && (
                    <p className="text-sm font-semibold">{vendor.price}</p>
                  )}

                  {vendor.rating && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= vendor.rating!
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {vendor.contactPerson && (
                      <p className="font-medium text-foreground">{vendor.contactPerson}</p>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        <a
                          href={`mailto:${vendor.email}`}
                          className="hover:text-foreground transition-colors"
                        >
                          {vendor.email}
                        </a>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        <a
                          href={`tel:${vendor.phone}`}
                          className="hover:text-foreground transition-colors"
                        >
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3" />
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors truncate"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Communications expand */}
                  {vendor.communications.length > 0 && (
                    <>
                      <Separator />
                      <button
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
                        onClick={() =>
                          setExpandedVendorId(isExpanded ? null : vendor.id)
                        }
                      >
                        <MessageSquare className="h-3 w-3" />
                        {vendor.communications.length} communication
                        {vendor.communications.length !== 1 ? "s" : ""}
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 ml-auto" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-auto" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="space-y-2 mt-2">
                          {vendor.communications.slice(0, 5).map((c) => (
                            <div
                              key={c.id}
                              className="text-xs bg-muted/50 rounded p-2 space-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{c.type}</span>
                                <span className="text-muted-foreground">
                                  {new Date(c.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{c.summary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editVendor ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Vendor Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Amazing Photography Co."
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Price / Quote</Label>
              <Input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="$2,500"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vendor@example.com"
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
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <Select
                value={form.rating || "none"}
                onValueChange={(v) => setForm({ ...form, rating: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No rating" />
                </SelectTrigger>
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
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editVendor ? "Update Vendor" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Log Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={commForm.type}
                onValueChange={(v) => setCommForm({ ...commForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PHONE">Phone Call</SelectItem>
                  <SelectItem value="IN_PERSON">In Person</SelectItem>
                  <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                  <SelectItem value="TEXT">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={commForm.date}
                onChange={(e) => setCommForm({ ...commForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Summary *</Label>
              <Textarea
                value={commForm.summary}
                onChange={(e) => setCommForm({ ...commForm, summary: e.target.value })}
                placeholder="Briefly describe what was discussed..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={commForm.followUpDate}
                onChange={(e) => setCommForm({ ...commForm, followUpDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComm} disabled={loading}>
              {loading ? "Saving..." : "Log Communication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this vendor? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
