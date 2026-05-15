"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Gift,
  Plus,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  CheckCircle,
  Heart,
} from "lucide-react"

// Server actions defined separately
import {
  createRegistryItem,
  deleteRegistryItem,
  createGiftReceived,
  updateThankYou,
} from "./actions"

interface RegistryItem {
  id: string
  name: string
  description: string | null
  price: string | null
  quantity: number
  purchased: number
  url: string | null
  store: string | null
  isExternal: boolean
  priority: string
  category: string | null
}

interface GiftReceived {
  id: string
  giverName: string
  description: string | null
  value: string | null
  thankYouSent: boolean
  registryItem: { id: string; name: string } | null
  guest: { id: string; firstName: string; lastName: string } | null
}

interface Guest {
  id: string
  firstName: string
  lastName: string
}

interface Props {
  weddingId: string
  registryItems: RegistryItem[]
  giftsReceived: GiftReceived[]
  guests: Guest[]
  role: string
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
}

const defaultItemForm = {
  name: "",
  description: "",
  price: "",
  store: "",
  url: "",
  quantity: "1",
  priority: "MEDIUM",
  category: "",
  isExternal: false,
}

const defaultGiftForm = {
  giverName: "",
  description: "",
  value: "",
  registryItemId: "",
  guestId: "",
}

export function RegistryClient({
  weddingId,
  registryItems,
  giftsReceived,
  guests,
  role,
}: Props) {
  const router = useRouter()
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [giftDialogOpen, setGiftDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState(defaultItemForm)
  const [giftForm, setGiftForm] = useState(defaultGiftForm)
  const [loading, setLoading] = useState(false)

  const canEdit = role !== "VIEWER"

  const totalItems = registryItems.reduce((s, r) => s + r.quantity, 0)
  const totalPurchased = registryItems.reduce((s, r) => s + r.purchased, 0)
  const progressPercent = totalItems > 0 ? Math.round((totalPurchased / totalItems) * 100) : 0

  async function handleCreateItem() {
    if (!itemForm.name) { toast.error("Item name is required"); return }
    setLoading(true)
    try {
      const res = await createRegistryItem(weddingId, {
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: itemForm.price || undefined,
        store: itemForm.store || undefined,
        url: itemForm.url || undefined,
        quantity: parseInt(itemForm.quantity) || 1,
        priority: itemForm.priority,
        category: itemForm.category || undefined,
        isExternal: itemForm.isExternal,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Item added to registry!")
      setItemDialogOpen(false)
      setItemForm(defaultItemForm)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteItem(id: string) {
    const res = await deleteRegistryItem(id, weddingId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Item removed")
    setDeleteId(null)
    router.refresh()
  }

  async function handleCreateGift() {
    if (!giftForm.giverName) { toast.error("Giver name is required"); return }
    setLoading(true)
    try {
      const res = await createGiftReceived(weddingId, {
        giverName: giftForm.giverName,
        description: giftForm.description || undefined,
        value: giftForm.value || undefined,
        registryItemId: giftForm.registryItemId || undefined,
        guestId: giftForm.guestId || undefined,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Gift recorded!")
      setGiftDialogOpen(false)
      setGiftForm(defaultGiftForm)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleThankYou(giftId: string, current: boolean) {
    const res = await updateThankYou(giftId, weddingId, !current)
    if (res.error) { toast.error(res.error); return }
    toast.success(!current ? "Thank you marked as sent!" : "Marked as unsent")
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Registry Progress</p>
              <p className="text-sm text-muted-foreground">
                {totalPurchased} of {totalItems} items received
              </p>
            </div>
            <span className="text-2xl font-bold font-serif text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Registry Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Registry Items</h2>
          {canEdit && (
            <Button onClick={() => setItemDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        {registryItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <Gift className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No registry items yet</p>
                <p className="text-muted-foreground text-sm">Add items you&apos;d love to receive</p>
              </div>
              {canEdit && (
                <Button onClick={() => setItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {registryItems.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardContent className="pt-4 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.store && (
                        <p className="text-xs text-muted-foreground">{item.store}</p>
                      )}
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority] ?? ""}`}>
                      {item.priority}
                    </Badge>
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                    {item.isExternal && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        External
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    {item.price && (
                      <span className="font-medium">${item.price}</span>
                    )}
                    <span className="text-muted-foreground text-xs ml-auto">
                      {item.purchased}/{item.quantity} received
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (item.purchased / item.quantity) * 100)}%` }}
                    />
                  </div>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on store
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Gifts Received */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold">Gifts Received</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {giftsReceived.filter((g) => !g.thankYouSent).length} thank you notes pending
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setGiftDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Record Gift
            </Button>
          )}
        </div>

        {giftsReceived.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No gifts recorded yet</p>
                <p className="text-muted-foreground text-sm">Track gifts as they arrive</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">From</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Item</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Value</th>
                  <th className="text-left p-3 font-medium">Thank You</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {giftsReceived.map((gift) => (
                  <tr key={gift.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{gift.giverName}</p>
                      {gift.guest && (
                        <p className="text-xs text-muted-foreground">
                          {gift.guest.firstName} {gift.guest.lastName}
                        </p>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <p className="text-sm">
                        {gift.registryItem?.name ?? gift.description ?? "—"}
                      </p>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {gift.value ? <span>${gift.value}</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => canEdit && handleThankYou(gift.id, gift.thankYouSent)}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                          gift.thankYouSent
                            ? "text-green-600"
                            : "text-muted-foreground hover:text-green-600"
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 ${gift.thankYouSent ? "fill-green-100" : ""}`}
                        />
                        {gift.thankYouSent ? "Sent" : "Pending"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Add Registry Item</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="KitchenAid Stand Mixer"
              />
            </div>
            <div className="space-y-2">
              <Label>Store</Label>
              <Input
                value={itemForm.store}
                onChange={(e) => setItemForm({ ...itemForm, store: e.target.value })}
                placeholder="Amazon, Target..."
              />
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="349.99"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity Desired</Label>
              <Input
                type="number"
                min="1"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={itemForm.priority}
                onValueChange={(v) => setItemForm({ ...itemForm, priority: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                placeholder="Kitchen, Home, Experience..."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>URL</Label>
              <Input
                value={itemForm.url}
                onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Color, size, or other details..."
                rows={2}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isExternal"
                checked={itemForm.isExternal}
                onChange={(e) => setItemForm({ ...itemForm, isExternal: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isExternal">External registry (Zola, The Knot, etc.)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateItem} disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Gift Dialog */}
      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Record Gift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From (Giver Name) *</Label>
              <Input
                value={giftForm.giverName}
                onChange={(e) => setGiftForm({ ...giftForm, giverName: e.target.value })}
                placeholder="Uncle Bob"
              />
            </div>
            <div className="space-y-2">
              <Label>Guest (optional)</Label>
              <Select
                value={giftForm.guestId || "none"}
                onValueChange={(v) => setGiftForm({ ...giftForm, guestId: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Link to guest..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No guest link</SelectItem>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.firstName} {g.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Registry Item (optional)</Label>
              <Select
                value={giftForm.registryItemId || "none"}
                onValueChange={(v) => setGiftForm({ ...giftForm, registryItemId: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Link to registry item..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not from registry</SelectItem>
                  {registryItems.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={giftForm.description}
                onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                placeholder="Blue throw blanket..."
              />
            </div>
            <div className="space-y-2">
              <Label>Value ($)</Label>
              <Input
                value={giftForm.value}
                onChange={(e) => setGiftForm({ ...giftForm, value: e.target.value })}
                placeholder="75.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGift} disabled={loading}>
              {loading ? "Recording..." : "Record Gift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Item</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Remove this item from your registry?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDeleteItem(deleteId)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
