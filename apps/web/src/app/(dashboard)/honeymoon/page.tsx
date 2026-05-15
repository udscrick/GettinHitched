import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getHoneymoon } from "@/actions/honeymoon"
import { HoneymoonClient } from "./HoneymoonClient"

export default async function HoneymoonPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) redirect("/onboarding")

  const honeymoon = await getHoneymoon(member.weddingId)

  return (
    <HoneymoonClient
      weddingId={member.weddingId}
      honeymoon={honeymoon}
      role={member.role}
    />
  )
}
