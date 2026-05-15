import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { VendorsClient } from "@/app/(dashboard)/vendors/VendorsClient"

export default async function EventVendorsPage({ params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      vendors: {
        include: { communications: { orderBy: { date: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
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
        <h1 className="font-serif text-2xl font-bold">Vendors — {event.name}</h1>
        <p className="text-muted-foreground mt-1">Manage vendors and service providers for this event</p>
      </div>
      <VendorsClient
        eventId={params.eventId}
        vendors={event.vendors}
        role={member.role}
      />
    </div>
  )
}
