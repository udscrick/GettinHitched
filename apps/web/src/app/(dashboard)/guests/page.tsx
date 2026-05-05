import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { GuestsClient } from "./GuestsClient"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, UserX, Clock } from "lucide-react"

export default async function GuestsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          guests: {
            include: { table: true },
            orderBy: { createdAt: "asc" },
          },
          guestGroups: { orderBy: { name: "asc" } },
          tables: { include: { guests: true }, orderBy: { name: "asc" } },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  const guests = wedding.guests
  const attending = guests.filter((g) => g.rsvpStatus === "ATTENDING").length
  const declined = guests.filter((g) => g.rsvpStatus === "DECLINED").length
  const pending = guests.filter((g) => g.rsvpStatus === "PENDING").length
  const maybe = guests.filter((g) => g.rsvpStatus === "MAYBE").length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Guest List</h1>
        <p className="text-muted-foreground mt-1">Manage your wedding guest list and RSVPs</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold font-serif">{guests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attending</p>
                <p className="text-2xl font-bold font-serif text-green-600">{attending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-2xl font-bold font-serif text-red-600">{declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold font-serif text-yellow-600">{pending + maybe}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <GuestsClient
        weddingId={wedding.id}
        guests={wedding.guests}
        tables={wedding.tables}
        role={role}
      />
    </div>
  )
}
