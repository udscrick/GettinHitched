import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { BudgetClient } from "@/app/(dashboard)/budget/BudgetClient"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, parseAmount } from "@/lib/utils"

export default async function EventBudgetPage({ params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      expenses: {
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!event) notFound()

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
    include: { wedding: { select: { currency: true } } },
  })
  if (!member) redirect("/events")
  const currency = member.wedding.currency ?? "INR"

  const categories = await db.expenseCategory.findMany({
    where: { weddingId: event.weddingId },
    orderBy: { sortOrder: "asc" },
  })

  const totalBudget = parseAmount(event.eventBudget)
  const totalEstimated = event.expenses.reduce((s, e) => s + parseAmount(e.amount), 0)
  const totalPaid = event.expenses
    .filter((e) => e.paymentStatus === "PAID")
    .reduce((s, e) => s + parseAmount(e.amount), 0)
  const budgetUsedPct = totalBudget > 0 ? Math.min((totalEstimated / totalBudget) * 100, 100) : 0

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold">Budget — {event.name}</h1>
        <p className="text-muted-foreground mt-1">Track expenses for this event</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Event Budget</p>
            <p className="text-2xl font-bold font-serif mt-1">
              {totalBudget > 0 ? formatCurrency(totalBudget, currency) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Estimated Total</p>
            <p className="text-2xl font-bold font-serif mt-1">{formatCurrency(totalEstimated, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold font-serif mt-1">{formatCurrency(totalPaid, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold font-serif mt-1">
              {totalBudget > 0 ? formatCurrency(totalBudget - totalEstimated, currency) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Budget used</span>
              <span className="font-medium">{budgetUsedPct.toFixed(0)}%</span>
            </div>
            <Progress value={budgetUsedPct} className="h-2" />
          </CardContent>
        </Card>
      )}

      <BudgetClient
        eventId={params.eventId}
        categories={categories}
        expenses={event.expenses}
        role={member.role}
      />
    </div>
  )
}
