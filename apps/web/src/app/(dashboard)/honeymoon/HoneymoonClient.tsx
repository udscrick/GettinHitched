"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  updateHoneymoon,
  addDestination,
  deleteDestination,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,
} from "@/actions/honeymoon"
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
import { Plus, Trash2, MapPin, Package, CheckSquare, Plane } from "lucide-react"

const TRAVEL_DOCS = [
  "Passports",
  "Visas (if required)",
  "Travel Insurance",
  "Flight Itinerary",
  "Hotel Confirmations",
  "Car Rental Confirmation",
  "Emergency Contacts List",
  "Credit Cards & Cash",
  "Driver's License (International)",
  "Health/Vaccination Records",
  "Travel App Downloads",
]

const PACKING_CATEGORIES = [
  "Clothing",
  "Documents",
  "Toiletries",
  "Electronics",
  "Health & Safety",
  "Entertainment",
  "Misc",
]

interface Destination {
  id: string
  name: string
  country: string | null
  arrivalDate: Date | string | null
  departureDate: Date | string | null
  accommodation: string | null
  estimatedCost: string | null
  isBooked: boolean
  notes: string | null
}

interface PackingItem {
  id: string
  name: string
  category: string | null
  isPacked: boolean
  quantity: number
}

interface HoneymoonPlan {
  id: string
  departureDate: Date | string | null
  returnDate: Date | string | null
  budget: string | null
  notes: string | null
  destinations: Destination[]
  packingItems: PackingItem[]
}

interface Props {
  weddingId: string
  honeymoon: HoneymoonPlan | null
  role: string
}

const defaultDestForm = {
  name: "",
  country: "",
  arrivalDate: "",
  departureDate: "",
  accommodation: "",
  estimatedCost: "",
  isBooked: false,
  notes: "",
}

const defaultPackingForm = {
  name: "",
  category: "Clothing",
  quantity: "1",
}

export function HoneymoonClient({ weddingId, honeymoon, role }: Props) {
  const router = useRouter()
  const [destDialogOpen, setDestDialogOpen] = useState(false)
  const [packDialogOpen, setPackDialogOpen] = useState(false)
  const [destForm, setDestForm] = useState(defaultDestForm)
  const [packForm, setPackForm] = useState(defaultPackingForm)
  const [loading, setLoading] = useState(false)
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set())

  const canEdit = role !== "VIEWER"
  const plan = honeymoon

  const packedCount = plan?.packingItems.filter((i) => i.isPacked).length ?? 0
  const totalPacking = plan?.packingItems.length ?? 0

  // Group packing items by category
  const packingByCategory: Record<string, PackingItem[]> = {}
  for (const item of plan?.packingItems ?? []) {
    const cat = item.category ?? "Misc"
    if (!packingByCategory[cat]) packingByCategory[cat] = []
    packingByCategory[cat].push(item)
  }

  async function handleAddDestination() {
    if (!destForm.name) { toast.error("Destination name is required"); return }
    if (!plan) return
    setLoading(true)
    try {
      await addDestination(plan.id, {
        name: destForm.name,
        country: destForm.country || undefined,
        arrivalDate: destForm.arrivalDate || undefined,
        departureDate: destForm.departureDate || undefined,
        accommodation: destForm.accommodation || undefined,
        estimatedCost: destForm.estimatedCost || undefined,
        isBooked: destForm.isBooked,
        notes: destForm.notes || undefined,
      })
      toast.success("Destination added!")
      setDestDialogOpen(false)
      setDestForm(defaultDestForm)
      router.refresh()
    } catch {
      toast.error("Failed to add destination")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteDestination(id: string) {
    try {
      await deleteDestination(id)
      toast.success("Destination removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove destination")
    }
  }

  async function handleAddPackingItem() {
    if (!packForm.name) { toast.error("Item name is required"); return }
    if (!plan) return
    setLoading(true)
    try {
      await addPackingItem(plan.id, {
        name: packForm.name,
        category: packForm.category,
        quantity: parseInt(packForm.quantity) || 1,
      })
      toast.success("Packing item added!")
      setPackDialogOpen(false)
      setPackForm(defaultPackingForm)
      router.refresh()
    } catch {
      toast.error("Failed to add item")
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePacking(id: string) {
    try {
      await togglePackingItem(id)
      router.refresh()
    } catch {
      toast.error("Failed to update item")
    }
  }

  async function handleDeletePacking(id: string) {
    try {
      await deletePackingItem(id)
      toast.success("Item removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove item")
    }
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Plane className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-lg">No honeymoon plan yet</p>
            <p className="text-muted-foreground text-sm">Start planning your dream getaway</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header details */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Departure</p>
              <p className="font-medium">
                {plan.departureDate
                  ? new Date(plan.departureDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "Not set"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Return</p>
              <p className="font-medium">
                {plan.returnDate
                  ? new Date(plan.returnDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "Not set"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="font-medium">{plan.budget ? `$${plan.budget}` : "Not set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destinations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Destinations</h2>
          {canEdit && (
            <Button onClick={() => setDestDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Destination
            </Button>
          )}
        </div>

        {plan.destinations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No destinations added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plan.destinations.map((dest) => (
              <Card key={dest.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{dest.name}</h3>
                        {dest.isBooked && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Booked
                          </Badge>
                        )}
                      </div>
                      {dest.country && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {dest.country}
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDestination(dest.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {(dest.arrivalDate || dest.departureDate) && (
                    <div className="text-sm text-muted-foreground">
                      {dest.arrivalDate && (
                        <span>
                          Arrive: {new Date(dest.arrivalDate).toLocaleDateString()}
                        </span>
                      )}
                      {dest.arrivalDate && dest.departureDate && <span> · </span>}
                      {dest.departureDate && (
                        <span>
                          Leave: {new Date(dest.departureDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  {dest.accommodation && (
                    <p className="text-sm">🏨 {dest.accommodation}</p>
                  )}
                  {dest.estimatedCost && (
                    <p className="text-sm font-medium text-primary">Est. ${dest.estimatedCost}</p>
                  )}
                  {dest.notes && (
                    <p className="text-xs text-muted-foreground">{dest.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Packing List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold">Packing List</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {packedCount}/{totalPacking} items packed
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setPackDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(packingByCategory).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {category}
                  <span className="text-muted-foreground font-normal ml-auto">
                    {items.filter((i) => i.isPacked).length}/{items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button
                      onClick={() => canEdit && handleTogglePacking(item.id)}
                      className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                        item.isPacked
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/40 hover:border-primary"
                      }`}
                      disabled={!canEdit}
                    >
                      {item.isPacked && (
                        <svg
                          className="h-2.5 w-2.5 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        item.isPacked ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.name}
                      {item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">×{item.quantity}</span>
                      )}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => handleDeletePacking(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Travel Document Checklist */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">Travel Document Checklist</h2>
        <Card>
          <CardContent className="pt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TRAVEL_DOCS.map((doc) => (
                <div key={doc} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newChecked = new Set(checkedDocs)
                      if (newChecked.has(doc)) {
                        newChecked.delete(doc)
                      } else {
                        newChecked.add(doc)
                      }
                      setCheckedDocs(newChecked)
                    }}
                    className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                      checkedDocs.has(doc)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {checkedDocs.has(doc) && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`text-sm ${
                      checkedDocs.has(doc) ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {doc}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Destination Dialog */}
      <Dialog open={destDialogOpen} onOpenChange={setDestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add Destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Destination Name *</Label>
              <Input
                value={destForm.name}
                onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                placeholder="Paris, Bali, Santorini..."
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={destForm.country}
                onChange={(e) => setDestForm({ ...destForm, country: e.target.value })}
                placeholder="France"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Arrival Date</Label>
                <Input
                  type="date"
                  value={destForm.arrivalDate}
                  onChange={(e) => setDestForm({ ...destForm, arrivalDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Input
                  type="date"
                  value={destForm.departureDate}
                  onChange={(e) => setDestForm({ ...destForm, departureDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accommodation</Label>
              <Input
                value={destForm.accommodation}
                onChange={(e) => setDestForm({ ...destForm, accommodation: e.target.value })}
                placeholder="Hotel Le Marais"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Cost ($)</Label>
              <Input
                value={destForm.estimatedCost}
                onChange={(e) => setDestForm({ ...destForm, estimatedCost: e.target.value })}
                placeholder="2500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBooked"
                checked={destForm.isBooked}
                onChange={(e) => setDestForm({ ...destForm, isBooked: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isBooked">Already booked</Label>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={destForm.notes}
                onChange={(e) => setDestForm({ ...destForm, notes: e.target.value })}
                placeholder="Activities, must-sees..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDestination} disabled={loading}>
              {loading ? "Adding..." : "Add Destination"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Packing Item Dialog */}
      <Dialog open={packDialogOpen} onOpenChange={setPackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add Packing Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={packForm.name}
                onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                placeholder="Sunscreen, Passport, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={packForm.category}
                onValueChange={(v) => setPackForm({ ...packForm, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PACKING_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={packForm.quantity}
                onChange={(e) => setPackForm({ ...packForm, quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPackingItem} disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
