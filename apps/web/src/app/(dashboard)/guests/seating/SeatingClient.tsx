"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  assignGuestToTable,
  createTable,
  deleteTable,
} from "@/actions/guests"
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
import { Plus, Trash2, UserX, Search, Users } from "lucide-react"

interface Guest {
  id: string
  firstName: string
  lastName: string
  side: string
  tableId: string | null
}

interface TableWithGuests {
  id: string
  name: string
  capacity: number
  shape: string
  guests: Guest[]
}

interface Props {
  weddingId: string
  guests: Guest[]
  tables: TableWithGuests[]
  role: string
}

const sideColors: Record<string, string> = {
  PARTNER_ONE: "bg-blue-100 text-blue-800",
  PARTNER_TWO: "bg-pink-100 text-pink-800",
  BOTH: "bg-purple-100 text-purple-800",
}

export function SeatingClient({ weddingId, guests, tables, role }: Props) {
  const router = useRouter()
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [addTableOpen, setAddTableOpen] = useState(false)
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null)
  const [tableForm, setTableForm] = useState({ name: "", capacity: "8", shape: "round" })
  const [loading, setLoading] = useState(false)

  const canEdit = role !== "VIEWER"
  const unassigned = guests.filter((g) => !g.tableId)
  const filteredUnassigned = unassigned.filter((g) => {
    const name = `${g.firstName} ${g.lastName}`.toLowerCase()
    return !search || name.includes(search.toLowerCase())
  })

  async function handleAssign(tableId: string) {
    if (!selectedGuestId) {
      toast.info("Select a guest first, then click a table to assign them")
      return
    }
    setLoading(true)
    try {
      const res = await assignGuestToTable(selectedGuestId, tableId, weddingId)
      if (res.error) { toast.error(res.error); return }
      toast.success("Guest assigned to table")
      setSelectedGuestId(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleUnassign(guestId: string) {
    const res = await assignGuestToTable(guestId, null, weddingId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Guest removed from table")
    router.refresh()
  }

  async function handleCreateTable() {
    if (!tableForm.name) { toast.error("Table name is required"); return }
    setLoading(true)
    try {
      const res = await createTable(weddingId, {
        name: tableForm.name,
        capacity: parseInt(tableForm.capacity) || 8,
        shape: tableForm.shape,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Table created!")
      setAddTableOpen(false)
      setTableForm({ name: "", capacity: "8", shape: "round" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTable(tableId: string) {
    const res = await deleteTable(tableId, weddingId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Table deleted")
    setDeleteTableId(null)
    router.refresh()
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Unassigned guests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-lg">
            Unassigned <span className="text-muted-foreground">({unassigned.length})</span>
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedGuestId && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-sm text-primary">
            Guest selected — click a table to assign them
          </div>
        )}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredUnassigned.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                {unassigned.length === 0 ? "All guests assigned!" : "No matching guests"}
              </CardContent>
            </Card>
          ) : (
            filteredUnassigned.map((guest) => (
              <div
                key={guest.id}
                onClick={() =>
                  canEdit &&
                  setSelectedGuestId(selectedGuestId === guest.id ? null : guest.id)
                }
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedGuestId === guest.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                } ${!canEdit ? "cursor-default" : ""}`}
              >
                <div>
                  <p className="font-medium text-sm">
                    {guest.firstName} {guest.lastName}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${sideColors[guest.side] ?? ""}`}
                >
                  {guest.side === "PARTNER_ONE"
                    ? "P1"
                    : guest.side === "PARTNER_TWO"
                    ? "P2"
                    : "Both"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Tables */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-lg">
            Tables <span className="text-muted-foreground">({tables.length})</span>
          </h2>
          {canEdit && (
            <Button onClick={() => setAddTableOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          )}
        </div>

        {tables.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="p-4 bg-muted rounded-full">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No tables yet</p>
              {canEdit && (
                <Button onClick={() => setAddTableOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Table
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {tables.map((table) => {
              const fillPercent = (table.guests.length / table.capacity) * 100
              const isFull = table.guests.length >= table.capacity
              return (
                <Card
                  key={table.id}
                  onClick={() => canEdit && !isFull && handleAssign(table.id)}
                  className={`transition-all ${
                    canEdit && selectedGuestId && !isFull
                      ? "cursor-pointer hover:border-primary hover:shadow-md border-2"
                      : ""
                  } ${isFull ? "opacity-75" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">{table.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {table.guests.length}/{table.capacity}
                        </Badge>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTableId(table.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isFull ? "bg-red-400" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 min-h-[40px]">
                      {table.guests.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between text-sm py-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>
                            {g.firstName} {g.lastName}
                          </span>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleUnassign(g.id)}
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {table.guests.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          {canEdit && selectedGuestId
                            ? "Click to assign selected guest"
                            : "No guests assigned"}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 capitalize">
                      {table.shape} table
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Table Dialog */}
      <Dialog open={addTableOpen} onOpenChange={setAddTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Table Name *</Label>
              <Input
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                placeholder="Table 1, Head Table, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={tableForm.capacity}
                onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Shape</Label>
              <Select
                value={tableForm.shape}
                onValueChange={(v) => setTableForm({ ...tableForm, shape: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTableOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTable} disabled={loading}>
              {loading ? "Creating..." : "Create Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <Dialog open={!!deleteTableId} onOpenChange={() => setDeleteTableId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Deleting this table will unassign all guests from it. Are you sure?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTableId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTableId && handleDeleteTable(deleteTableId)}
            >
              Delete Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
