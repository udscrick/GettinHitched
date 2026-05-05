import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { VendorsClient } from "./VendorsClient"

export default async function VendorsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          vendors: {
            include: {
              communications: { orderBy: { date: "desc" } },
            },
            orderBy: { createdAt: "desc" },
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
        <h1 className="font-serif text-3xl font-bold">Vendors</h1>
        <p className="text-muted-foreground mt-1">
          Manage your wedding vendors and service providers
        </p>
      </div>
      <VendorsClient
        weddingId={wedding.id}
        vendors={wedding.vendors}
        role={role}
      />
    </div>
  )
}
