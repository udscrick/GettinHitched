"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createExpense, updateExpense, deleteExpense, createCategory } from "@/actions/budget"
import { expenseSchema, type ExpenseInput } from "@/lib/validations/budget"
import { formatCurrency, formatDateShort, parseAmount } from "@/lib/utils"
import { useWedding } from "@/contexts/WeddingContext"
import { Plus, Pencil, Trash2, DollarSign, Tags } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "warning" | "outline" | "default" }> = {
  PAID: { label: "Paid", variant: "success" },
  ADVANCE_GIVEN: { label: "Advance Given", variant: "warning" },
  PENDING: { label: "Pending", variant: "outline" },
}

const DEFAULT_COLORS = [
  "#C9A96E", "#f9a8c9", "#86efac", "#93c5fd", "#fca5a5",
  "#d8b4fe", "#fdba74", "#a5f3fc", "#fde68a", "#c4b5fd",
]

interface Expense {
  id: string
  title: string
  description: string | null
  amount: string
  paymentStatus: string
  expenseDate: Date | null
  paidBy: string | null
  vendorName: string | null
  notes: string | null
  categoryId: string | null
  category: { id: string; name: string; color: string } | null
}

interface Category {
  id: string
  name: string
  color: string
}

export function BudgetClient({
  eventId,
  categories: initialCategories,
  expenses,
  role,
}: {
  eventId: string
  categories: Category[]
  expenses: Expense[]
  role: string
}) {
  const router = useRouter()
  const { wedding } = useWedding()
  const currency = wedding?.currency ?? "INR"
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [addOpen, setAddOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [saving, setSaving] = useState(false)

  // Category quick-add state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState(DEFAULT_COLORS[0])
  const [savingCat, setSavingCat] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { paymentStatus: "PENDING", amount: "0" },
  })

  const canEdit = role !== "VIEWER"

  async function onSubmit(data: ExpenseInput) {
    setSaving(true)
    try {
      if (editExpense) {
        const result = await updateExpense(editExpense.id, eventId, data)
        if (result.error) { toast.error(result.error); return }
        toast.success("Expense updated")
        setEditExpense(null)
      } else {
        const result = await createExpense(eventId, data)
        if (result.error) { toast.error(result.error); return }
        toast.success("Expense added")
        setAddOpen(false)
      }
      reset()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return
    const result = await deleteExpense(id, eventId)
    if (result.error) { toast.error(result.error); return }
    toast.success("Expense deleted")
    router.refresh()
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const result = await createCategory(eventId, { name: newCatName.trim(), color: newCatColor })
      if (result.error) { toast.error(result.error); return }
      if (result.category) {
        setCategories((prev) => [...prev, result.category as Category])
      }
      toast.success("Category added")
      setNewCatName("")
      setNewCatColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)])
      setCatDialogOpen(false)
    } finally {
      setSavingCat(false)
    }
  }

  function openEdit(expense: Expense) {
    setEditExpense(expense)
    reset({
      title: expense.title,
      description: expense.description ?? "",
      categoryId: expense.categoryId ?? "",
      vendorName: expense.vendorName ?? "",
      amount: expense.amount,
      paymentStatus: expense.paymentStatus as ExpenseInput["paymentStatus"],
      paidBy: expense.paidBy ?? "",
      notes: expense.notes ?? "",
    })
  }

  const filtered = expenses.filter((e) => {
    if (filterCategory !== "all" && e.categoryId !== filterCategory) return false
    if (filterStatus !== "all" && e.paymentStatus !== filterStatus) return false
    return true
  })

  const chartData = categories
    .map((cat) => {
      const total = expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + parseAmount(e.amount), 0)
      return { name: cat.name, value: total, color: cat.color }
    })
    .filter((d) => d.value > 0)

  const ExpenseForm = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input {...register("title")} placeholder="e.g. Venue deposit" className="mt-1" />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Amount</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
            <Input {...register("amount")} placeholder="0" className="pl-6" />
          </div>
        </div>
        <div>
          <Label>Payment Status</Label>
          <Select defaultValue="PENDING" onValueChange={(v) => setValue("paymentStatus", v as ExpenseInput["paymentStatus"])}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ADVANCE_GIVEN">Advance Given</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between">
            <Label>Category</Label>
            {canEdit && (
              <button
                type="button"
                onClick={() => setCatDialogOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            )}
          </div>
          <Select onValueChange={(v) => setValue("categoryId", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={categories.length === 0 ? "No categories — add one →" : "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </div>
                </SelectItem>
              ))}
              {categories.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No categories yet</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Vendor (optional)</Label>
          <Input {...register("vendorName")} placeholder="e.g. Taj Caterers" className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Paid By</Label>
          <Input {...register("paidBy")} placeholder="e.g. Bride's family" className="mt-1" />
        </div>
        <div>
          <Label>Expense Date</Label>
          <Input type="date" {...register("expenseDate")} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea {...register("notes")} placeholder="Additional notes..." className="mt-1" rows={2} />
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditExpense(null); reset() }}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? "Saving..." : editExpense ? "Update" : "Add Expense"}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      {/* Category quick-add dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Catering"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${newCatColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewCatColor(c)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="h-6 w-6 rounded cursor-pointer border-0"
                  title="Custom color"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
              <Button variant="gold" disabled={!newCatName.trim() || savingCat} onClick={handleAddCategory}>
                {savingCat ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val, currency)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.slice(0, 8).map((cat) => {
                  const spent = expenses
                    .filter((e) => e.categoryId === cat.id)
                    .reduce((s, e) => s + parseAmount(e.amount), 0)
                  if (spent === 0) return null
                  return (
                    <div key={cat.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                        <span className="text-muted-foreground">{formatCurrency(spent, currency)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Expenses</CardTitle>
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)}>
                  <Tags className="mr-1 h-4 w-4" /> Add Category
                </Button>
              )}
              {canEdit && (
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gold" size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    {ExpenseForm}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap mt-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ADVANCE_GIVEN">Advance Given</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No expenses yet</p>
              <p className="text-sm mt-1">Add your first expense to start tracking your budget</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((expense) => {
                const status = STATUS_BADGES[expense.paymentStatus] ?? STATUS_BADGES.PENDING
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: expense.category?.color ?? "#ccc" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{expense.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {expense.category && <span>{expense.category.name}</span>}
                        {expense.vendorName && <span>· {expense.vendorName}</span>}
                        {expense.paidBy && <span>· {expense.paidBy}</span>}
                        {expense.expenseDate && <span>· {formatDateShort(expense.expenseDate)}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{formatCurrency(expense.amount, currency)}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Dialog open={!!editExpense && editExpense.id === expense.id} onOpenChange={(o) => !o && setEditExpense(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(expense)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Expense</DialogTitle>
                            </DialogHeader>
                            {ExpenseForm}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
