import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { GuestsClient } from "@/app/(dashboard)/guests/GuestsClient"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, UserX, Clock } from "lucide-react"

export default async function EventGuestsPage({ params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      guests: {
        include: { table: true },
        orderBy: { createdAt: "asc" },
      },
      guestGroups: { orderBy: { name: "asc" } },
      tables: { include: { guests: true }, orderBy: { name: "asc" } },
    },
  })
  if (!event) notFound()

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  if (!member) redirect("/events")

  const guests = event.guests
  const confirmed = guests.filter(g => g.rsvpStatus === "CONFIRMED").length
  const declined = guests.filter(g => g.rsvpStatus === "DECLINED").length
  const pending = guests.filter(g => g.rsvpStatus === "PENDING").length

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold">Guests — {event.name}</h1>
        <p className="text-muted-foreground mt-1">Manage the guest list and RSVPs for this event</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold font-serif">{guests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><UserCheck className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold font-serif">{confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><UserX className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-2xl font-bold font-serif">{declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold font-serif">{pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GuestsClient
        eventId={params.eventId}
        guests={event.guests}
        tables={event.tables}
        role={member.role}
      />
    </div>
  )
}
