"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createTask, toggleTask, deleteTask } from "@/actions/tasks"
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
import { CheckSquare, Plus, Trash2, AlertTriangle, PartyPopper } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: Date | string | null
  isCompleted: boolean
  priority: string
  category: string | null
  notes: string | null
}

interface Props {
  eventId: string
  tasks: Task[]
  role: string
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-800 border-red-200" },
  HIGH: { label: "High", className: "bg-amber-100 text-amber-800 border-amber-200" },
  MEDIUM: { label: "Medium", className: "bg-sage-100 text-green-800 border-green-200" },
  LOW: { label: "Low", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

const CATEGORIES = [
  "Venue", "Catering", "Photography", "Flowers", "Music", "Attire",
  "Invitations", "Honeymoon", "Legal", "Beauty", "Decor", "Transportation",
  "Registry", "Budget", "General",
]

const defaultForm = {
  title: "",
  description: "",
  category: "General",
  priority: "MEDIUM",
  dueDate: "",
}

export function TasksClient({ eventId, tasks, role }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")

  const canEdit = role !== "VIEWER"

  const now = new Date()
  const overdue = tasks.filter(
    (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now
  )
  const completed = tasks.filter((t) => t.isCompleted)
  const completionPercent =
    tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0

  const filtered = tasks.filter((t) => {
    if (filterCategory !== "ALL" && t.category !== filterCategory) return false
    if (filterStatus === "COMPLETED" && !t.isCompleted) return false
    if (filterStatus === "PENDING" && t.isCompleted) return false
    return true
  })

  // Group by category
  const grouped: Record<string, Task[]> = {}
  for (const task of filtered) {
    const cat = task.category ?? "General"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(task)
  }

  const categories = Object.keys(grouped).sort()

  async function handleToggle(taskId: string, current: boolean) {
    const res = await toggleTask(taskId, eventId, !current)
    if (res.error) { toast.error(res.error); return }
    router.refresh()
  }

  async function handleCreate() {
    if (!form.title) { toast.error("Task title is required"); return }
    setLoading(true)
    try {
      const res = await createTask(eventId, {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success("Task created!")
      setDialogOpen(false)
      setForm(defaultForm)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteTask(id, eventId)
    if (res.error) { toast.error(res.error); return }
    toast.success("Task deleted")
    setDeleteId(null)
    router.refresh()
  }

  const allDone = tasks.length > 0 && tasks.every((t) => t.isCompleted)

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Overall Progress</p>
              <p className="text-sm text-muted-foreground">
                {completed.length} of {tasks.length} tasks completed
              </p>
            </div>
            <span className="text-2xl font-bold font-serif text-primary">
              {completionPercent}%
            </span>
          </div>
          <Progress value={completionPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* All done state */}
      {allDone && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <PartyPopper className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-green-800">
              All done! 🎉
            </h3>
            <p className="text-green-700 mt-1">
              You&apos;ve completed every task. Your big day is going to be perfect!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tasks</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Overdue section */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Overdue Tasks ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {overdue.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                canEdit={canEdit}
                onToggle={handleToggle}
                onDelete={setDeleteId}
                isOverdue
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tasks by category */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 bg-muted rounded-full">
              <CheckSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">No tasks yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Add tasks to track everything for your wedding
              </p>
            </div>
            {canEdit && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const catTasks = grouped[category]
            const catCompleted = catTasks.filter((t) => t.isCompleted).length
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{category}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {catCompleted}/{catTasks.length}
                    </span>
                  </div>
                  <Progress
                    value={catTasks.length > 0 ? (catCompleted / catTasks.length) * 100 : 0}
                    className="h-1.5"
                  />
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {catTasks.map((task) => {
                    const isTaskOverdue =
                      !task.isCompleted && task.dueDate && new Date(task.dueDate) < now
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
                        onToggle={handleToggle}
                        onDelete={setDeleteId}
                        isOverdue={!!isTaskOverdue}
                      />
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Book the photographer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                    <SelectItem value="HIGH">🟠 High</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                    <SelectItem value="LOW">⚪ Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this task?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskRow({
  task,
  canEdit,
  onToggle,
  onDelete,
  isOverdue,
}: {
  task: Task
  canEdit: boolean
  onToggle: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  isOverdue: boolean
}) {
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM

  return (
    <div
      className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
        task.isCompleted ? "opacity-60" : ""
      } ${isOverdue ? "bg-red-50" : "hover:bg-muted/30"}`}
    >
      <button
        onClick={() => canEdit && onToggle(task.id, task.isCompleted)}
        className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded border-2 transition-colors ${
          task.isCompleted
            ? "bg-primary border-primary text-white"
            : "border-muted-foreground/40 hover:border-primary"
        }`}
        disabled={!canEdit}
      >
        {task.isCompleted && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            task.isCompleted ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className={`text-xs ${priorityCfg.className}`}>
            {priorityCfg.label}
          </Badge>
          {task.dueDate && (
            <span
              className={`text-xs ${
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              }`}
            >
              {isOverdue ? "⚠️ " : ""}Due:{" "}
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
      {canEdit && (
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
