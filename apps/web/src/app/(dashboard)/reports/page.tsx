import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, DollarSign, CheckSquare, TrendingUp } from "lucide-react"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: { wedding: true },
  })
  if (!member) redirect("/onboarding")

  const { weddingId, wedding } = member

  const events = await db.event.findMany({ where: { weddingId }, select: { id: true } })
  const eventIds = events.map((e) => e.id)

  const [guests, expenses, categories, tasks] = await Promise.all([
    db.guest.findMany({ where: { eventId: { in: eventIds } } }),
    db.expense.findMany({
      where: { category: { eventId: { in: eventIds } } },
      include: { category: true },
    }),
    db.expenseCategory.findMany({ where: { eventId: { in: eventIds } } }),
    db.task.findMany({ where: { eventId: { in: eventIds } } }),
  ])

  // Guest analytics
  const totalGuests = guests.length
  const confirmed = guests.filter((g) => g.rsvpStatus === "CONFIRMED").length
  const declined = guests.filter((g) => g.rsvpStatus === "DECLINED").length
  const pending = guests.filter((g) => g.rsvpStatus === "PENDING").length
  const dietaryNeeds = guests.filter((g) => g.dietaryRestriction || g.dietaryNotes).length

  const sideBreakdown = {
    partner1: guests.filter((g) => g.side === "PARTNER_ONE").length,
    partner2: guests.filter((g) => g.side === "PARTNER_TWO").length,
    mutual: guests.filter((g) => g.side === "BOTH").length,
  }

  // Budget analytics — totalBudget = sum of all category budgets across events
  const totalBudget = categories.reduce((sum, c) => sum + parseFloat(c.budgetAmount ?? "0"), 0)
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.totalAmount ?? "0"), 0)
  const totalEstimated = totalSpent
  const totalPaid = expenses.reduce((sum, e) => sum + parseFloat(e.paidAmount ?? "0"), 0)
  const remaining = totalBudget - totalSpent

  const byCategory = categories
    .map((cat) => {
      const catExpenses = expenses.filter((e) => e.categoryId === cat.id)
      const spent = catExpenses.reduce((sum, e) => sum + parseFloat(e.totalAmount ?? "0"), 0)
      return { name: cat.name, spent, count: catExpenses.length, color: cat.color }
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.spent - a.spent)

  // Task analytics
  const completedTasks = tasks.filter((t) => t.isCompleted).length
  const overdueTasks = tasks.filter(
    (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
  ).length

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Overview of your wedding planning progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Guests", value: totalGuests, sub: `${confirmed} confirmed`, icon: Users, color: "text-blue-600" },
          { label: "Budget Used", value: `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, sub: formatCurrency(totalSpent) + " spent", icon: DollarSign, color: "text-green-600" },
          { label: "Tasks Done", value: `${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%`, sub: `${completedTasks} / ${tasks.length}`, icon: CheckSquare, color: "text-purple-600" },
          { label: "Budget Left", value: formatCurrency(remaining), sub: remaining >= 0 ? "on track" : "over budget", icon: TrendingUp, color: remaining >= 0 ? "text-green-600" : "text-red-600" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Guest Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Guest Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">RSVP Status</p>
              {[
                { label: "Confirmed", count: confirmed, color: "bg-green-500" },
                { label: "Declined", count: declined, color: "bg-red-400" },
                { label: "Pending", count: pending, color: "bg-amber-400" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-20">{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: totalGuests > 0 ? `${(count / totalGuests) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t space-y-1">
              <p className="text-sm font-medium mb-2">By Side</p>
              {[
                { label: wedding.partnerOneName + "'s", count: sideBreakdown.partner1 },
                { label: wedding.partnerTwoName + "'s", count: sideBreakdown.partner2 },
                { label: "Mutual", count: sideBreakdown.mutual },
              ].map(({ label, count }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
            {dietaryNeeds > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dietary Needs</span>
                  <Badge variant="secondary">{dietaryNeeds} guests</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded yet</p>
            ) : (
              byCategory.map(({ name, spent, color }) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">{formatCurrency(spent)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: totalSpent > 0 ? `${(spent / totalSpent) * 100}%` : "0%",
                        backgroundColor: color ?? "#C9A96E",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Budget", value: formatCurrency(totalBudget) },
              { label: "Estimated Total", value: formatCurrency(totalEstimated) },
              { label: "Actual Spent", value: formatCurrency(totalSpent) },
              { label: "Amount Paid", value: formatCurrency(totalPaid) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {totalBudget > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Budget used</span>
                <span>{Math.min(100, Math.round((totalSpent / totalBudget) * 100))}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Planning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 mb-4">
            {[
              { label: "Completed", value: completedTasks, color: "text-green-600" },
              { label: "Overdue", value: overdueTasks, color: "text-red-600" },
              { label: "Remaining", value: tasks.length - completedTasks, color: "text-amber-600" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          {tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Overall completion</span>
                <span>{Math.round((completedTasks / tasks.length) * 100)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
