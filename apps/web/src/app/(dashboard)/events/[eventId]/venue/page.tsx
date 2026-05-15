import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { VenuesClient } from "@/app/(dashboard)/venues/VenuesClient"

export default async function EventVenuePage({ params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      venues: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!event) notFound()

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  if (!member) redirect("/events")

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold">Venues — {event.name}</h1>
        <p className="text-muted-foreground mt-1">Research and compare venues for this event</p>
      </div>
      <VenuesClient
        eventId={params.eventId}
        venues={event.venues}
        role={member.role}
      />
    </div>
  )
}
