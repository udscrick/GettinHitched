import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Users, DollarSign, ShoppingBag, Building2, CheckSquare, LayoutDashboard, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const EVENT_NAV = [
  { label: "Overview",       href: "",          icon: LayoutDashboard },
  { label: "Guests",         href: "/guests",   icon: Users },
  { label: "Budget",         href: "/budget",   icon: DollarSign },
  { label: "Vendors",        href: "/vendors",  icon: ShoppingBag },
  { label: "Venue",          href: "/venue",    icon: Building2 },
  { label: "Tasks",          href: "/tasks",    icon: CheckSquare },
]

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { eventId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: { wedding: true },
  })
  if (!event) notFound()

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  if (!member) redirect("/events")

  const base = `/events/${params.eventId}`

  return (
    <div className="flex flex-col min-h-full">
      {/* Event sub-header */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/events" className="hover:text-foreground transition-colors">Events</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate">{event.name}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          {EVENT_NAV.map(item => {
            const href = `${base}${item.href}`
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
