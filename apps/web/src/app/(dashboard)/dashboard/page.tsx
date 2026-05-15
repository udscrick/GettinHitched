import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import { Calendar, Users, CheckSquare, DollarSign, ChevronRight, Plus, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

const EVENT_TYPE_COLORS: Record<string, string> = {
  ROKA: "bg-amber-100 text-amber-800",
  ENGAGEMENT: "bg-pink-100 text-pink-800",
  MEHENDI: "bg-green-100 text-green-800",
  HALDI: "bg-yellow-100 text-yellow-800",
  SANGEET: "bg-purple-100 text-purple-800",
  TILAK: "bg-orange-100 text-orange-800",
  BARAAT: "bg-red-100 text-red-800",
  WEDDING_CEREMONY: "bg-rose-100 text-rose-800",
  RECEPTION: "bg-blue-100 text-blue-800",
  GRIHA_PRAVESH: "bg-teal-100 text-teal-800",
  CUSTOM: "bg-gray-100 text-gray-800",
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  ROKA: "Roka", ENGAGEMENT: "Engagement", MEHENDI: "Mehendi", HALDI: "Haldi",
  SANGEET: "Sangeet", TILAK: "Tilak", BARAAT: "Baraat",
  WEDDING_CEREMONY: "Wedding Ceremony", RECEPTION: "Reception",
  GRIHA_PRAVESH: "Griha Pravesh", CUSTOM: "Custom",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const userExists = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!userExists) await signOut({ redirectTo: "/sign-in" })

  const member = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          events: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { guests: true, tasks: true } },
              guests: { where: { rsvpStatus: "CONFIRMED" }, select: { id: true } },
              tasks: { where: { isCompleted: false }, select: { id: true } },
              expenses: { select: { amount: true, paymentStatus: true } },
            },
          },
        },
      },
    },
  })

  if (!member) redirect("/onboarding")
  const { wedding } = member

  const totalGuests = wedding.events.reduce((s, e) => s + e._count.guests, 0)
  const totalOpenTasks = wedding.events.reduce((s, e) => s + e._count.tasks, 0)
  const totalSpend = wedding.events.reduce((s, e) =>
    s + e.expenses.reduce((es, ex) => es + parseFloat(ex.amount || "0"), 0), 0)

  const now = new Date()
  const upcoming = wedding.events
    .filter(e => e.date && new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0]
  const daysToNext = upcoming?.date ? differenceInDays(new Date(upcoming.date), now) : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">
          {wedding.partnerOneName} &amp; {wedding.partnerTwoName}
        </h1>
        <p className="text-muted-foreground mt-1">Wedding planning overview</p>
      </div>

      {upcoming && daysToNext !== null && (
        <Link href={`/events/${upcoming.id}`}>
          <Card className="bg-gradient-to-r from-champagne/30 to-blush/20 border-champagne-gold/30 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between py-5 px-6">
              <div>
                <p className="text-sm text-muted-foreground">Next event</p>
                <p className="font-serif text-xl font-bold mt-0.5">{upcoming.name}</p>
                {upcoming.date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(upcoming.date), "EEEE, d MMMM yyyy")}
                    {upcoming.location && ` · ${upcoming.location}`}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-serif text-4xl font-bold text-champagne-gold">{daysToNext}</p>
                <p className="text-sm text-muted-foreground">days away</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Calendar className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Events</p>
                <p className="text-2xl font-bold font-serif">{wedding.events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><Users className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold font-serif">{totalGuests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50"><CheckSquare className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Open Tasks</p>
                <p className="text-2xl font-bold font-serif">{totalOpenTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><DollarSign className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spend</p>
                <p className="text-xl font-bold font-serif">
                  {formatCurrency(totalSpend, wedding.currency ?? "INR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold">All Events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/events">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>

        {wedding.events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 gap-4">
              <Calendar className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No events yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first event — Mehendi, Sangeet, Wedding Ceremony, and more
                </p>
              </div>
              <Button variant="gold" asChild>
                <Link href="/events"><Plus className="h-4 w-4 mr-2" />Add First Event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {wedding.events.map(event => {
              const openTasks = event.tasks.length
              const totalPaid = event.expenses.filter(e => e.paymentStatus === "PAID").reduce((s, e) => s + parseFloat(e.amount || "0"), 0)
              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.CUSTOM}`}>
                            {EVENT_TYPE_LABELS[event.type] ?? event.type}
                          </span>
                          <span className="font-semibold truncate">{event.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          {event.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date), "d MMM yyyy")}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                        <span>{event._count.guests} guests</span>
                        <span>{openTasks} open tasks</span>
                        <span>{formatCurrency(totalPaid, wedding.currency ?? "INR")} paid</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
