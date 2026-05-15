"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWedding } from "@/contexts/WeddingContext"
import { toast } from "sonner"
import {
  createPartyMember,
  updatePartyMember,
  deletePartyMember,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Plus, MoreHorizontal, Pencil, Trash2, CheckCircle } from "lucide-react"

const ROLES = [
  "MAID_OF_HONOR", "BEST_MAN", "BRIDESMAID", "GROOMSMAN",
  "FLOWER_GIRL", "RING_BEARER", "JUNIOR_BRIDESMAID", "JUNIOR_GROOMSMAN",
  "MOTHER_OF_BRIDE", "FATHER_OF_BRIDE", "MOTHER_OF_GROOM", "FATHER_OF_GROOM",
]

const ROLE_LABELS: Record<string, string> = {
  MAID_OF_HONOR: "Maid of Honor",
  BEST_MAN: "Best Man",
  BRIDESMAID: "Bridesmaid",
  GROOMSMAN: "Groomsman",
  FLOWER_GIRL: "Flower Girl",
  RING_BEARER: "Ring Bearer",
  JUNIOR_BRIDESMAID: "Junior Bridesmaid",
  JUNIOR_GROOMSMAN: "Junior Groomsman",
  MOTHER_OF_BRIDE: "Mother of Bride",
  FATHER_OF_BRIDE: "Father of Bride",
  MOTHER_OF_GROOM: "Mother of Groom",
  FATHER_OF_GROOM: "Father of Groom",
}

const SIDE_COLORS: Record<string, string> = {
  PARTNER_ONE: "bg-blue-100 text-blue-800",
  PARTNER_TWO: "bg-pink-100 text-pink-800",
  BOTH: "bg-purple-100 text-purple-800",
}

interface Member {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  side: string | null
  dressSize: string | null
  shoeSize: string | null
  suitSize: string | null
  waist: string | null
  chest: string | null
  inseam: string | null
  outfitColor: string | null
  outfitStyle: string | null
  outfitOrdered: boolean
  outfitPickedUp: boolean
  duties: string | null
  notes: string | null
}

interface Props {
  weddingId: string
  members: Member[]
  role: string
}

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  role: "BRIDESMAID",
  side: "PARTNER_ONE",
  dressSize: "",
  shoeSize: "",
  suitSize: "",
  waist: "",
  chest: "",
  inseam: "",
  outfitColor: "",
  outfitStyle: "",
  outfitOrdered: false,
  outfitPickedUp: false,
  duties: "",
  notes: "",
}

export function WeddingPartyClient({ weddingId, members, role }: Props) {
  const router = useRouter()
  const { wedding } = useWedding()
  const p1 = wedding?.partnerOneName ?? "Partner 1"
  const p2 = wedding?.partnerTwoName ?? "Partner 2"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  const canEdit = role !== "VIEWER"

  const partnerOneSide = members.filter(
    (m) => m.side === "PARTNER_ONE" || m.side === null
  )
  const partnerTwoSide = members.filter((m) => m.side === "PARTNER_TWO")
  const bothSide = members.filter((m) => m.side === "BOTH")

  function openAdd() {
    setEditMember(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(member: Member) {
    setEditMember(member)
    setForm({
      name: member.name,
      email: member.email ?? "",
      phone: member.phone ?? "",
      role: member.role,
      side: member.side ?? "PARTNER_ONE",
      dressSize: member.dressSize ?? "",
      shoeSize: member.shoeSize ?? "",
      suitSize: member.suitSize ?? "",
      waist: member.waist ?? "",
      chest: member.chest ?? "",
      inseam: member.inseam ?? "",
      outfitColor: member.outfitColor ?? "",
      outfitStyle: member.outfitStyle ?? "",
      outfitOrdered: member.outfitOrdered,
      outfitPickedUp: member.outfitPickedUp,
      duties: member.duties ?? "",
      notes: member.notes ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!form.name) { toast.error("Name is required"); return }
    setLoading(true)
    try {
      const data = {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        role: form.role,
        side: form.side,
        dressSize: form.dressSize || undefined,
        shoeSize: form.shoeSize || undefined,
        suitSize: form.suitSize || undefined,
        waist: form.waist || undefined,
        chest: form.chest || undefined,
        inseam: form.inseam || undefined,
        outfitColor: form.outfitColor || undefined,
        outfitStyle: form.outfitStyle || undefined,
        outfitOrdered: form.outfitOrdered,
        outfitPickedUp: form.outfitPickedUp,
        duties: form.duties || undefined,
        notes: form.notes || undefined,
      }
      if (editMember) {
        const res = await updatePartyMember(editMember.id, weddingId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Member updated!")
      } else {
        const res = await createPartyMember(weddingId, data)
        if (res.error) { toast.error(res.error); return }
        toast.success("Member added!")
      }
      setDialogOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deletePartyMember(id, weddingId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Member removed")
    setDeleteId(null)
    router.refresh()
  }

  function renderMemberCard(member: Member) {
    const initials = member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    return (
      <Card key={member.id} className="relative">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 bg-primary/10">
              <AvatarFallback className="text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </p>
                </div>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(member)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(member.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {member.email && (
                <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
              )}

              <div className="flex gap-1.5 mt-2 flex-wrap">
                {member.outfitOrdered && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    <CheckCircle className="h-2.5 w-2.5 mr-1" />
                    Outfit Ordered
                  </Badge>
                )}
                {member.outfitPickedUp && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                    <CheckCircle className="h-2.5 w-2.5 mr-1" />
                    Outfit Picked Up
                  </Badge>
                )}
              </div>

              {(member.dressSize || member.suitSize) && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Size: {member.dressSize || member.suitSize}
                  {member.shoeSize ? ` · Shoe: ${member.shoeSize}` : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {canEdit && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">No wedding party members yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Add your bridesmaids, groomsmen, and other party members
              </p>
            </div>
            {canEdit && (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {partnerOneSide.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-semibold text-blue-700">
                {p1}&apos;s Side
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnerOneSide.map(renderMemberCard)}
              </div>
            </div>
          )}

          {partnerTwoSide.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-semibold text-pink-700">
                {p2}&apos;s Side
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnerTwoSide.map(renderMemberCard)}
              </div>
            </div>
          )}

          {bothSide.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-semibold text-purple-700">
                Both Sides / Family
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bothSide.map(renderMemberCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editMember ? "Edit Member" : "Add Wedding Party Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sarah Johnson"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Side</Label>
              <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTNER_ONE">{p1}&apos;s Side</SelectItem>
                  <SelectItem value="PARTNER_TWO">{p2}&apos;s Side</SelectItem>
                  <SelectItem value="BOTH">Both / Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="sarah@example.com"
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

            {/* Outfit Section */}
            <div className="col-span-2">
              <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Outfit & Measurements
              </h3>
            </div>
            <div className="space-y-2">
              <Label>Dress Size</Label>
              <Input
                value={form.dressSize}
                onChange={(e) => setForm({ ...form, dressSize: e.target.value })}
                placeholder="Size 8"
              />
            </div>
            <div className="space-y-2">
              <Label>Suit Size</Label>
              <Input
                value={form.suitSize}
                onChange={(e) => setForm({ ...form, suitSize: e.target.value })}
                placeholder="40R"
              />
            </div>
            <div className="space-y-2">
              <Label>Shoe Size</Label>
              <Input
                value={form.shoeSize}
                onChange={(e) => setForm({ ...form, shoeSize: e.target.value })}
                placeholder="8.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Waist</Label>
              <Input
                value={form.waist}
                onChange={(e) => setForm({ ...form, waist: e.target.value })}
                placeholder='32"'
              />
            </div>
            <div className="space-y-2">
              <Label>Chest</Label>
              <Input
                value={form.chest}
                onChange={(e) => setForm({ ...form, chest: e.target.value })}
                placeholder='40"'
              />
            </div>
            <div className="space-y-2">
              <Label>Inseam</Label>
              <Input
                value={form.inseam}
                onChange={(e) => setForm({ ...form, inseam: e.target.value })}
                placeholder='30"'
              />
            </div>
            <div className="space-y-2">
              <Label>Outfit Color</Label>
              <Input
                value={form.outfitColor}
                onChange={(e) => setForm({ ...form, outfitColor: e.target.value })}
                placeholder="Dusty rose"
              />
            </div>
            <div className="space-y-2">
              <Label>Outfit Style</Label>
              <Input
                value={form.outfitStyle}
                onChange={(e) => setForm({ ...form, outfitStyle: e.target.value })}
                placeholder="Floor-length A-line"
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="outfitOrdered"
                checked={form.outfitOrdered}
                onChange={(e) => setForm({ ...form, outfitOrdered: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="outfitOrdered">Outfit Ordered</Label>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="outfitPickedUp"
                checked={form.outfitPickedUp}
                onChange={(e) => setForm({ ...form, outfitPickedUp: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="outfitPickedUp">Outfit Picked Up</Label>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Duties / Responsibilities</Label>
              <Textarea
                value={form.duties}
                onChange={(e) => setForm({ ...form, duties: e.target.value })}
                placeholder="Organize bachelorette party, help with decorations..."
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any other notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editMember ? "Update Member" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Member</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Remove this person from your wedding party?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
