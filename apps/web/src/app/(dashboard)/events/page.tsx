import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { EventsClient } from "./EventsClient"

export default async function EventsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          events: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: {
                select: { guests: true, tasks: true, vendors: true },
              },
            },
          },
        },
      },
    },
  })

  if (!member) redirect("/onboarding")

  return (
    <EventsClient
      events={member.wedding.events}
      weddingId={member.wedding.id}
      partnerOneName={member.wedding.partnerOneName}
      partnerTwoName={member.wedding.partnerTwoName}
      role={member.role}
    />
  )
}
