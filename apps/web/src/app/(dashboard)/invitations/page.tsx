import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { InvitationsClient } from "./InvitationsClient"

export default async function InvitationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          invitationBatches: {
            include: {
              invitations: {
                include: {
                  guest: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          guests: {
            select: { id: true, firstName: true, lastName: true, email: true },
            orderBy: { firstName: "asc" },
          },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Invitations</h1>
        <p className="text-muted-foreground mt-1">
          Manage invitation batches and track delivery status
        </p>
      </div>
      <InvitationsClient
        weddingId={wedding.id}
        batches={wedding.invitationBatches}
        allGuests={wedding.guests}
        role={role}
      />
    </div>
  )
}
