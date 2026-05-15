"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  createBatch,
  markBatchSent,
  deleteBatch,
  addGuestsToBatch,
} from "@/actions/invitations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Mail, Plus, MoreHorizontal, Trash2, CheckCircle, Users, Download } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  NOT_SENT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  OPENED: "bg-emerald-100 text-emerald-700",
}

interface Invitation {
  id: string
  status: string
  sentAt: Date | string | null
  guest: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
}

interface Batch {
  id: string
  name: string
  type: string
  method: string
  sentAt: Date | string | null
  rsvpDeadline: Date | string | null
  invitations: Invitation[]
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

interface Props {
  weddingId: string
  batches: Batch[]
  allGuests: Guest[]
  role: string
}

const defaultForm = {
  name: "",
  type: "WEDDING",
  method: "BOTH",
  rsvpDeadline: "",
  notes: "",
}

export function InvitationsClient({ weddingId, batches, allGuests, role }: Props) {
  const router = useRouter()
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [addGuestsDialogOpen, setAddGuestsDialogOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const canEdit = role !== "VIEWER"

  async function handleCreateBatch() {
    if (!form.name) { toast.error("Batch name is required"); return }
    setLoading(true)
    try {
      const res = await createBatch(weddingId, {
        name: form.name,
        type: form.type,
        method: form.method,
        rsvpDeadline: form.rsvpDeadline || undefined,
        notes: form.notes || undefined,
      })
      if (!res) { toast.error("Failed to create batch"); return }
      toast.success("Invitation batch created!")
      setBatchDialogOpen(false)
      setForm(defaultForm)
      router.refresh()
    } catch {
      toast.error("Failed to create batch")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkSent(batchId: string) {
    try {
      await markBatchSent(batchId)
      toast.success("Batch marked as sent!")
      router.refresh()
    } catch {
      toast.error("Failed to update batch")
    }
  }

  async function handleDeleteBatch(batchId: string) {
    try {
      await deleteBatch(batchId)
      toast.success("Batch deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete batch")
    }
  }

  async function handleAddGuests() {
    if (!selectedBatchId || selectedGuests.size === 0) {
      toast.error("Select at least one guest")
      return
    }
    setLoading(true)
    try {
      await addGuestsToBatch(selectedBatchId, Array.from(selectedGuests))
      toast.success(`${selectedGuests.size} guest(s) added to batch!`)
      setAddGuestsDialogOpen(false)
      setSelectedGuests(new Set())
      router.refresh()
    } catch {
      toast.error("Failed to add guests")
    } finally {
      setLoading(false)
    }
  }

  function toggleGuestSelection(guestId: string) {
    const next = new Set(selectedGuests)
    if (next.has(guestId)) {
      next.delete(guestId)
    } else {
      next.add(guestId)
    }
    setSelectedGuests(next)
  }

  function handleExportAddresses(batch: Batch) {
    const rows = batch.invitations
      .map((inv) => `${inv.guest.firstName} ${inv.guest.lastName},${inv.guest.email ?? ""}`)
      .join("\n")
    const blob = new Blob([`Name,Email\n${rows}`], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${batch.name}-guests.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Exported guest list!")
  }

  const totalSent = batches.reduce(
    (s, b) => s + b.invitations.filter((i) => i.status !== "NOT_SENT").length,
    0
  )
  const totalInvites = batches.reduce((s, b) => s + b.invitations.length, 0)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalSent} of {totalInvites} total invitations sent
        </p>
        {canEdit && (
          <Button onClick={() => setBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        )}
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-lg">No invitation batches yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Create batches for your wedding invitations, save-the-dates, etc.
              </p>
            </div>
            {canEdit && (
              <Button onClick={() => setBatchDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const sentCount = batch.invitations.filter((i) => i.status !== "NOT_SENT").length
            return (
              <Card key={batch.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{batch.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {batch.type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {batch.method}
                        </Badge>
                        {batch.sentAt ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent {new Date(batch.sentAt).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                            Not Sent
                          </Badge>
                        )}
                        {batch.rsvpDeadline && (
                          <span className="text-xs text-muted-foreground">
                            RSVP by: {new Date(batch.rsvpDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBatchId(batch.id)
                              setSelectedGuests(new Set())
                              setAddGuestsDialogOpen(true)
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Add Guests
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkSent(batch.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark All as Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportAddresses(batch)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Guest List
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteBatch(batch.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Batch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: batch.invitations.length > 0
                            ? `${(sentCount / batch.invitations.length) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {sentCount}/{batch.invitations.length} sent
                    </span>
                  </div>
                </CardHeader>
                {batch.invitations.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="text-left p-2 pl-3 font-medium text-xs">Guest</th>
                            <th className="text-left p-2 font-medium text-xs hidden sm:table-cell">Email</th>
                            <th className="text-left p-2 font-medium text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {batch.invitations.slice(0, 10).map((inv) => (
                            <tr key={inv.id} className="hover:bg-muted/20">
                              <td className="p-2 pl-3">
                                {inv.guest.firstName} {inv.guest.lastName}
                              </td>
                              <td className="p-2 hidden sm:table-cell text-muted-foreground">
                                {inv.guest.email ?? "—"}
                              </td>
                              <td className="p-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${STATUS_COLORS[inv.status] ?? ""}`}
                                >
                                  {inv.status.replace("_", " ")}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {batch.invitations.length > 10 && (
                            <tr>
                              <td
                                colSpan={3}
                                className="p-2 pl-3 text-xs text-muted-foreground"
                              >
                                +{batch.invitations.length - 10} more guests
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Batch Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Create Invitation Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Batch Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Main Wedding Invitations"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEDDING">Wedding</SelectItem>
                    <SelectItem value="SAVE_THE_DATE">Save the Date</SelectItem>
                    <SelectItem value="ENGAGEMENT_PARTY">Engagement Party</SelectItem>
                    <SelectItem value="REHEARSAL_DINNER">Rehearsal Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIGITAL">Digital</SelectItem>
                    <SelectItem value="PHYSICAL">Physical / Mail</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>RSVP Deadline</Label>
              <Input
                type="date"
                value={form.rsvpDeadline}
                onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBatch} disabled={loading}>
              {loading ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Guests Dialog */}
      <Dialog open={addGuestsDialogOpen} onOpenChange={setAddGuestsDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Add Guests to Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Select guests to add to this invitation batch:
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-2">
              {allGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer"
                  onClick={() => toggleGuestSelection(guest.id)}
                >
                  <div
                    className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                      selectedGuests.has(guest.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {selectedGuests.has(guest.id) && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">
                    {guest.firstName} {guest.lastName}
                  </span>
                  {guest.email && (
                    <span className="text-xs text-muted-foreground ml-auto">{guest.email}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedGuests.size} guest(s) selected
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGuestsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGuests} disabled={loading || selectedGuests.size === 0}>
              {loading ? "Adding..." : `Add ${selectedGuests.size} Guest(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
