import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { WeddingPartyClient } from "./WeddingPartyClient"

export default async function WeddingPartyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          weddingParty: { orderBy: [{ side: "asc" }, { sortOrder: "asc" }] },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">Wedding Party</h1>
        <p className="text-muted-foreground mt-1">
          Manage your wedding party members and their details
        </p>
      </div>
      <WeddingPartyClient
        weddingId={wedding.id}
        members={wedding.weddingParty}
        role={role}
      />
    </div>
  )
}
