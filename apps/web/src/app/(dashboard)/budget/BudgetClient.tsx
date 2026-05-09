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
import { Progress } from "@/components/ui/progress"
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
import { createExpense, updateExpense, deleteExpense } from "@/actions/budget"
import { expenseSchema, type ExpenseInput } from "@/lib/validations/budget"
import { formatCurrency, formatDateShort, parseAmount } from "@/lib/utils"
import { Plus, Pencil, Trash2, DollarSign, CheckCircle2 } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "outline" | "default" }> = {
  PAID: { label: "Paid", variant: "success" },
  PARTIAL: { label: "Partial", variant: "warning" },
  UNPAID: { label: "Unpaid", variant: "outline" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "default" },
}

interface Expense {
  id: string
  title: string
  description: string | null
  totalAmount: string
  paidAmount: string
  status: string
  dueDate: Date | null
  isDeposit: boolean
  notes: string | null
  categoryId: string | null
  vendorId: string | null
  category: { id: string; name: string; color: string } | null
  vendor: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
  color: string
  budgetAmount: string
}

interface Vendor {
  id: string
  name: string
  type: string
}

export function BudgetClient({
  eventId,
  categories,
  expenses,
  vendors,
  role,
}: {
  eventId: string
  categories: Category[]
  expenses: Expense[]
  vendors: Vendor[]
  role: string
}) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { status: "UNPAID", totalAmount: "0", paidAmount: "0", isDeposit: false },
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

  function openEdit(expense: Expense) {
    setEditExpense(expense)
    reset({
      title: expense.title,
      description: expense.description ?? "",
      categoryId: expense.categoryId ?? "",
      vendorId: expense.vendorId ?? "",
      totalAmount: expense.totalAmount,
      paidAmount: expense.paidAmount,
      status: expense.status as ExpenseInput["status"],
      isDeposit: expense.isDeposit,
      notes: expense.notes ?? "",
    })
  }

  // Filtered expenses
  const filtered = expenses.filter((e) => {
    if (filterCategory !== "all" && e.categoryId !== filterCategory) return false
    if (filterStatus !== "all" && e.status !== filterStatus) return false
    return true
  })

  // Chart data
  const chartData = categories
    .map((cat) => {
      const total = expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + parseAmount(e.totalAmount), 0)
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Total Amount</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input {...register("totalAmount")} placeholder="0" className="pl-6" />
          </div>
        </div>
        <div>
          <Label>Amount Paid</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input {...register("paidAmount")} placeholder="0" className="pl-6" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select onValueChange={(v) => setValue("categoryId", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select defaultValue="UNPAID" onValueChange={(v) => setValue("status", v as ExpenseInput["status"])}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Vendor (optional)</Label>
          <Select onValueChange={(v) => setValue("vendorId", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Due Date</Label>
          <Input type="date" {...register("dueDate")} className="mt-1" />
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
      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie chart */}
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
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Category bars */}
          <Card>
            <CardHeader>
              <CardTitle>Category Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.slice(0, 8).map((cat) => {
                  const spent = expenses
                    .filter((e) => e.categoryId === cat.id)
                    .reduce((s, e) => s + parseAmount(e.totalAmount), 0)
                  const budget = parseAmount(cat.budgetAmount)
                  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
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
                        <span className="text-muted-foreground">
                          {formatCurrency(spent)}{budget > 0 && ` / ${formatCurrency(budget)}`}
                        </span>
                      </div>
                      {budget > 0 && <Progress value={pct} className="h-1.5" />}
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
          {/* Filters */}
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
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
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
                const status = STATUS_BADGES[expense.status] ?? STATUS_BADGES.UNPAID
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{expense.title}</p>
                        {expense.isDeposit && (
                          <Badge variant="gold" className="text-[10px] py-0">Deposit</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {expense.category && <span>{expense.category.name}</span>}
                        {expense.vendor && <span>· {expense.vendor.name}</span>}
                        {expense.dueDate && <span>· Due {formatDateShort(expense.dueDate)}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{formatCurrency(expense.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {parseAmount(expense.paidAmount) > 0 && `${formatCurrency(expense.paidAmount)} paid`}
                      </p>
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

      {/* Edit dialog */}
    </div>
  )
}
