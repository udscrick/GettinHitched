import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Users, CheckSquare, ShoppingBag, DollarSign, Building2, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

const EVENT_TYPE_LABELS: Record<string, string> = {
  ROKA: "Roka", ENGAGEMENT: "Engagement", MEHENDI: "Mehendi", HALDI: "Haldi",
  SANGEET: "Sangeet", TILAK: "Tilak / Sagan", BARAAT: "Baraat",
  WEDDING_CEREMONY: "Wedding Ceremony", RECEPTION: "Reception",
  GRIHA_PRAVESH: "Griha Pravesh", CUSTOM: "Custom",
}

export default async function EventOverviewPage({ params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      _count: { select: { guests: true, tasks: true, vendors: true, venues: true } },
      guests: { where: { rsvpStatus: "CONFIRMED" }, select: { id: true } },
      tasks: { where: { isCompleted: true }, select: { id: true } },
      expenses: { select: { amount: true, paymentStatus: true } },
    },
  })
  if (!event) notFound()

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
    include: { wedding: { select: { currency: true } } },
  })
  if (!member) redirect("/events")
  const currency = member.wedding.currency ?? "INR"

  const totalBudget = event.expenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0)
  const totalPaid = event.expenses
    .filter((e) => e.paymentStatus === "PAID")
    .reduce((s, e) => s + parseFloat(e.amount || "0"), 0)
  const confirmedGuests = event.guests.length
  const completedTasks = event.tasks.length

  const base = `/events/${params.eventId}`

  const quickLinks = [
    { label: "Guests & RSVPs", href: `${base}/guests`, icon: Users, stat: `${event._count.guests} guests`, sub: `${confirmedGuests} confirmed` },
    { label: "Budget & Expenses", href: `${base}/budget`, icon: DollarSign, stat: `${formatCurrency(totalPaid, currency)} paid`, sub: `of ${formatCurrency(totalBudget, currency)}` },
    { label: "Vendors", href: `${base}/vendors`, icon: ShoppingBag, stat: `${event._count.vendors} vendors`, sub: "booked & researching" },
    { label: "Venue", href: `${base}/venue`, icon: Building2, stat: `${event._count.venues} venues`, sub: "considered" },
    { label: "Tasks", href: `${base}/tasks`, icon: CheckSquare, stat: `${completedTasks}/${event._count.tasks}`, sub: "tasks completed" },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Event header */}
      <div className="mb-8">
        <div className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-champagne/30 text-champagne-gold mb-2">
          {EVENT_TYPE_LABELS[event.type] ?? event.type}
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">{event.name}</h1>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          {event.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.date), "EEEE, d MMMM yyyy")}
              {event.startTime && ` · ${event.startTime}`}
              {event.endTime && ` – ${event.endTime}`}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>
          )}
        </div>
        {event.description && (
          <p className="mt-3 text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* Quick-access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-champagne/20">
                    <item.icon className="h-5 w-5 text-champagne-gold" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold mt-1">{item.stat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
