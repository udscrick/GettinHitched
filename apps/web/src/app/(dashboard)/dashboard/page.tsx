import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDate, formatCurrency, daysUntil, parseAmount } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Heart,
  Users,
  DollarSign,
  CheckSquare,
  ShoppingBag,
  Calendar,
  Clock,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: { wedding: true },
    orderBy: { joinedAt: "asc" },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding } = weddingMember
  const wid = wedding.id

  // Fetch stats in parallel
  const [guests, expenses, tasks, vendors] = await Promise.all([
    db.guest.findMany({ where: { weddingId: wid }, select: { rsvpStatus: true } }),
    db.expense.findMany({ where: { weddingId: wid }, select: { totalAmount: true, paidAmount: true, status: true, dueDate: true, title: true } }),
    db.task.findMany({ where: { weddingId: wid }, select: { isCompleted: true, dueDate: true, priority: true, title: true } }),
    db.vendor.findMany({ where: { weddingId: wid }, select: { status: true, name: true, type: true } }),
  ])

  const days = daysUntil(wedding.weddingDate)
  const totalBudget = parseAmount(wedding.totalBudget)
  const totalSpent = expenses.reduce((s, e) => s + parseAmount(e.paidAmount), 0)
  const totalEstimated = expenses.reduce((s, e) => s + parseAmount(e.totalAmount), 0)
  const budgetPct = totalBudget > 0 ? Math.min(100, (totalEstimated / totalBudget) * 100) : 0
  const spentPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

  const rsvpAttending = guests.filter((g) => g.rsvpStatus === "ATTENDING").length
  const rsvpDeclined = guests.filter((g) => g.rsvpStatus === "DECLINED").length
  const rsvpPending = guests.filter((g) => g.rsvpStatus === "PENDING").length

  const completedTasks = tasks.filter((t) => t.isCompleted).length
  const taskPct = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

  const overdueTasks = tasks.filter(
    (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
  )
  const upcomingTasks = tasks
    .filter((t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  const bookedVendors = vendors.filter((v) =>
    ["BOOKED", "CONTRACT_SIGNED", "COMPLETED"].includes(v.status)
  ).length

  const upcomingPayments = expenses
    .filter((e) => e.status !== "PAID" && e.dueDate && new Date(e.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3)

  const QUICK_ACTIONS = [
    { label: "Add Guest", href: "/guests", icon: Users },
    { label: "Add Expense", href: "/budget", icon: DollarSign },
    { label: "Add Task", href: "/tasks", icon: CheckSquare },
    { label: "Add Vendor", href: "/vendors", icon: ShoppingBag },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">
            {wedding.partnerOneName} & {wedding.partnerTwoName}
          </h1>
          {wedding.weddingDate && (
            <p className="text-muted-foreground mt-1">
              {formatDate(wedding.weddingDate)}
              {wedding.city && ` · ${wedding.city}${wedding.state ? `, ${wedding.state}` : ""}`}
            </p>
          )}
        </div>
        {days !== null && (
          <div className={`flex items-center gap-2 rounded-2xl px-5 py-3 ${
            days === 0
              ? "bg-champagne-gold text-white"
              : days < 0
              ? "bg-sage-100 text-sage-700"
              : "bg-champagne text-champagne-gold"
          }`}>
            <Heart className="h-5 w-5" />
            <div className="text-center">
              <p className="text-2xl font-bold leading-none">
                {days === 0 ? "TODAY!" : Math.abs(days)}
              </p>
              <p className="text-xs mt-0.5">
                {days === 0 ? "💍" : days > 0 ? "days to go" : "days ago"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href}>
              <div className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm font-medium transition-colors hover:bg-accent card-hover">
                <Icon className="h-4 w-4 text-champagne-gold" />
                {action.label}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Guests */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium font-sans flex items-center justify-between">
              Guests
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{guests.length}</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="success">{rsvpAttending} Attending</Badge>
              <Badge variant="destructive">{rsvpDeclined} Declined</Badge>
              <Badge variant="outline">{rsvpPending} Pending</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium font-sans flex items-center justify-between">
              Budget
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(totalBudget)} total budget
            </p>
            <Progress value={spentPct} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium font-sans flex items-center justify-between">
              Checklist
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">
              {completedTasks}/{tasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              tasks completed
              {overdueTasks.length > 0 && (
                <span className="text-destructive ml-1">· {overdueTasks.length} overdue</span>
              )}
            </p>
            <Progress value={taskPct} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        {/* Vendors */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium font-sans flex items-center justify-between">
              Vendors
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{bookedVendors}/{vendors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">booked</p>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-champagne-gold" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">All caught up! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.title} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      task.priority === "URGENT" ? "bg-destructive" :
                      task.priority === "HIGH" ? "bg-amber-500" : "bg-sage-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View all tasks →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-champagne-gold" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((payment) => (
                  <div key={payment.title} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{payment.title}</p>
                      {payment.dueDate && (
                        <p className="text-xs text-muted-foreground">{formatDate(payment.dueDate)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-champagne-gold">
                        {formatCurrency(parseAmount(payment.totalAmount) - parseAmount(payment.paidAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">remaining</p>
                    </div>
                  </div>
                ))}
                <Link href="/budget">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View budget →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RSVP breakdown */}
      {guests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-champagne-gold" />
              RSVP Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Responses received</span>
                  <span>{guests.length - rsvpPending}/{guests.length}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="bg-emerald-400 transition-all"
                    style={{ width: `${(rsvpAttending / guests.length) * 100}%` }}
                  />
                  <div
                    className="bg-red-300 transition-all"
                    style={{ width: `${(rsvpDeclined / guests.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-sm shrink-0">
                <div className="text-center">
                  <div className="text-lg font-bold font-serif text-emerald-600">{rsvpAttending}</div>
                  <div className="text-xs text-muted-foreground">Yes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-serif text-red-500">{rsvpDeclined}</div>
                  <div className="text-xs text-muted-foreground">No</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-serif text-muted-foreground">{rsvpPending}</div>
                  <div className="text-xs text-muted-foreground">Awaiting</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
