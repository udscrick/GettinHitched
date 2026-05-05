import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { SeatingClient } from "./SeatingClient"

export default async function SeatingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          guests: {
            orderBy: { firstName: "asc" },
          },
          tables: {
            include: {
              guests: { orderBy: { firstName: "asc" } },
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  const unassignedGuests = wedding.guests.filter((g) => !g.tableId)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Seating Chart</h1>
        <p className="text-muted-foreground mt-1">
          Assign guests to tables — {unassignedGuests.length} unassigned of {wedding.guests.length} total
        </p>
      </div>
      <SeatingClient
        weddingId={wedding.id}
        guests={wedding.guests}
        tables={wedding.tables}
        role={role}
      />
    </div>
  )
}
