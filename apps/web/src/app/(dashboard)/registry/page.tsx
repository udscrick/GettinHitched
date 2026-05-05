import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { RegistryClient } from "./RegistryClient"

export default async function RegistryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          registryItems: { orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
          giftsReceived: {
            include: { registryItem: true, guest: true },
            orderBy: { createdAt: "desc" },
          },
          guests: { select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Gift Registry</h1>
        <p className="text-muted-foreground mt-1">Manage your registry and track received gifts</p>
      </div>
      <RegistryClient
        weddingId={wedding.id}
        registryItems={wedding.registryItems}
        giftsReceived={wedding.giftsReceived}
        guests={wedding.guests}
        role={role}
      />
    </div>
  )
}
