import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatCurrency, parseAmount } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BudgetClient } from "./BudgetClient"

export default async function BudgetPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          expenseCategories: { orderBy: { sortOrder: "asc" } },
          expenses: {
            include: { category: true, vendor: true },
            orderBy: { createdAt: "desc" },
          },
          vendors: { select: { id: true, name: true, type: true } },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  const totalBudget = parseAmount(wedding.totalBudget)
  const totalEstimated = wedding.expenses.reduce((s, e) => s + parseAmount(e.totalAmount), 0)
  const totalPaid = wedding.expenses.reduce((s, e) => s + parseAmount(e.paidAmount), 0)
  const remaining = totalBudget - totalEstimated

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Budget & Expenses</h1>
        <p className="text-muted-foreground mt-1">Track every dollar of your wedding budget</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold font-serif mt-1">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Estimated Total</p>
            <p className="text-2xl font-bold font-serif mt-1">{formatCurrency(totalEstimated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold font-serif mt-1 text-emerald-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining Budget</p>
            <p className={`text-2xl font-bold font-serif mt-1 ${remaining < 0 ? "text-destructive" : "text-champagne-gold"}`}>
              {formatCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget progress bar */}
      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Budget Used</span>
              <span className="text-muted-foreground">
                {formatCurrency(totalEstimated)} / {formatCurrency(totalBudget)}
                {" "}({Math.round((totalEstimated / totalBudget) * 100)}%)
              </span>
            </div>
            <Progress
              value={Math.min(100, (totalEstimated / totalBudget) * 100)}
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Paid: {formatCurrency(totalPaid)}</span>
              <span>Outstanding: {formatCurrency(totalEstimated - totalPaid)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client interactive section */}
      <BudgetClient
        weddingId={wedding.id}
        wedding={wedding}
        categories={wedding.expenseCategories}
        expenses={wedding.expenses}
        vendors={wedding.vendors}
        role={role}
      />
    </div>
  )
}
