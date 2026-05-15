"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWedding } from "@/contexts/WeddingContext"
import { toast } from "sonner"
import {
  createGuest,
  updateGuest,
  deleteGuest,
  updateGuestRSVP,
} from "@/actions/guests"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Plus, MoreHorizontal, Pencil, Trash2, Search, Filter, Rows3 } from "lucide-react"
import { BulkAddDialog } from "./BulkAddDialog"

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  side: string
  rsvpStatus: string
  dietaryRestriction: string | null
  dietaryNotes: string | null
  isChild: boolean
  notes: string | null
  address: string | null
  tableId: string | null
  table: { id: string; name: string } | null
}

interface Table {
  id: string
  name: string
  capacity: number
}

interface Props {
  eventId: string
  guests: Guest[]
  tables: Table[]
  role: string
}

const rsvpColors: Record<string, string> = {
  ATTENDING: "bg-green-100 text-green-800 border-green-200",
  DECLINED: "bg-red-100 text-red-800 border-red-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  MAYBE: "bg-gray-100 text-gray-700 border-gray-200",
}

const sideColors: Record<string, string> = {
  PARTNER_ONE: "bg-blue-100 text-blue-800 border-blue-200",
  PARTNER_TWO: "bg-pink-100 text-pink-800 border-pink-200",
  BOTH: "bg-purple-100 text-purple-800 border-purple-200",
}

function useSideLabels(): Record<string, string> {
  const { wedding } = useWedding()
  return {
    PARTNER_ONE: wedding?.partnerOneName ?? "Partner 1",
    PARTNER_TWO: wedding?.partnerTwoName ?? "Partner 2",
    BOTH: "Both",
  }
}

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  side: "BOTH",
  rsvpStatus: "PENDING",
  dietaryRestriction: "",
  dietaryNotes: "",
  isChild: false,
  notes: "",
  address: "",
}

export function GuestsClient({ eventId, guests, tables, role }: Props) {
  const router = useRouter()
  const sideLabels = useSideLabels()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editGuest, setEditGuest] = useState<Guest | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterRsvp, setFilterRsvp] = useState("ALL")
  const [filterSide, setFilterSide] = useState("ALL")

  const canEdit = role !== "VIEWER"

  const filtered = guests.filter((g) => {
    const name = `${g.firstName} ${g.lastName}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (filterRsvp !== "ALL" && g.rsvpStatus !== filterRsvp) return false
    if (filterSide !== "ALL" && g.side !== filterSide) return false
    return true
  })

  function openAdd() {
    setEditGuest(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(guest: Guest) {
    setEditGuest(guest)
    setForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      side: guest.side,
      rsvpStatus: guest.rsvpStatus,
      dietaryRestriction: guest.dietaryRestriction ?? "",
      dietaryNotes: guest.dietaryNotes ?? "",
      isChild: guest.isChild,
      notes: guest.notes ?? "",
      address: guest.address ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const data = {
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
        dietaryRestriction: form.dietaryRestriction || undefined,
        dietaryNotes: form.dietaryNotes || undefined,
        notes: form.notes || undefined,
        address: form.address || undefined,
      }
      if (editGuest) {
        const res = await updateGuest(editGuest.id, eventId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Guest updated!")
      } else {
        const res = await createGuest(eventId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Guest added!")
      }
      setDialogOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteGuest(id, eventId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Guest removed")
    setDeleteId(null)
    router.refresh()
  }

  async function handleRsvp(guestId: string, status: string) {
    const res = await updateGuestRSVP(guestId, eventId, status)
    if (res.error) { toast.error(res.error); return }
    toast.success("RSVP updated")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-48"
            />
          </div>
          <Select value={filterRsvp} onValueChange={setFilterRsvp}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="RSVP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All RSVPs</SelectItem>
              <SelectItem value="ATTENDING">Attending</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="MAYBE">Maybe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSide} onValueChange={setFilterSide}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sides</SelectItem>
              <SelectItem value="PARTNER_ONE">{sideLabels.PARTNER_ONE}</SelectItem>
              <SelectItem value="PARTNER_TWO">{sideLabels.PARTNER_TWO}</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)} className="shrink-0">
              <Rows3 className="h-4 w-4 mr-2" />
              Bulk Add
            </Button>
            <Button onClick={openAdd} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Guest
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">No guests yet</p>
              <p className="text-muted-foreground text-sm mt-1">Start building your guest list</p>
            </div>
            {canEdit && (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Guest
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Side</th>
                <th className="text-left p-3 font-medium">RSVP</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Dietary</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Table</th>
                {canEdit && <th className="p-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((guest) => (
                <tr key={guest.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">
                      {guest.firstName} {guest.lastName}
                      {guest.isChild && (
                        <span className="ml-2 text-xs text-muted-foreground">(child)</span>
                      )}
                    </div>
                    {guest.email && (
                      <div className="text-xs text-muted-foreground">{guest.email}</div>
                    )}
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={sideColors[guest.side] ?? ""}
                    >
                      {sideLabels[guest.side] ?? guest.side}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className={rsvpColors[guest.rsvpStatus] ?? ""}
                    >
                      {guest.rsvpStatus}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {guest.dietaryRestriction ? (
                      <span className="text-xs">{guest.dietaryRestriction}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    {guest.table ? (
                      <span className="text-xs">{guest.table.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Unassigned</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(guest)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRsvp(guest.id, "ATTENDING")}>
                            ✓ Mark Attending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRsvp(guest.id, "DECLINED")}>
                            ✗ Mark Declined
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRsvp(guest.id, "MAYBE")}>
                            ? Mark Maybe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(guest.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Add Dialog */}
      <BulkAddDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        eventId={eventId}
        sideLabels={sideLabels}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editGuest ? "Edit Guest" : "Add Guest"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.com"
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
            <div className="space-y-2">
              <Label>Side</Label>
              <Select
                value={form.side}
                onValueChange={(v) => setForm({ ...form, side: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTNER_ONE">{sideLabels.PARTNER_ONE}&apos;s Side</SelectItem>
                  <SelectItem value="PARTNER_TWO">{sideLabels.PARTNER_TWO}&apos;s Side</SelectItem>
                  <SelectItem value="BOTH">Both / Mutual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RSVP Status</Label>
              <Select
                value={form.rsvpStatus}
                onValueChange={(v) => setForm({ ...form, rsvpStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ATTENDING">Attending</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="MAYBE">Maybe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dietary Restriction</Label>
              <Select
                value={form.dietaryRestriction || "none"}
                onValueChange={(v) => setForm({ ...form, dietaryRestriction: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="VEGETARIAN">Vegetarian</SelectItem>
                  <SelectItem value="VEGAN">Vegan</SelectItem>
                  <SelectItem value="GLUTEN_FREE">Gluten-Free</SelectItem>
                  <SelectItem value="KOSHER">Kosher</SelectItem>
                  <SelectItem value="HALAL">Halal</SelectItem>
                  <SelectItem value="NUT_ALLERGY">Nut Allergy</SelectItem>
                  <SelectItem value="DAIRY_FREE">Dairy-Free</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dietary Notes</Label>
              <Input
                value={form.dietaryNotes}
                onChange={(e) => setForm({ ...form, dietaryNotes: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isChild"
                checked={form.isChild}
                onChange={(e) => setForm({ ...form, isChild: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isChild">This guest is a child</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editGuest ? "Update Guest" : "Add Guest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Guest</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to remove this guest? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove Guest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
