import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function POST(
  _req: Request,
  { params }: { params: { batchId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()

  await db.invitationBatch.update({
    where: { id: params.batchId },
    data: { sentAt: now },
  })

  await db.invitation.updateMany({
    where: { batchId: params.batchId, sentAt: null },
    data: { sentAt: now, status: "SENT" },
  })

  const batch = await db.invitationBatch.findUnique({
    where: { id: params.batchId },
    include: {
      invitations: {
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  })

  revalidatePath("/invitations")
  return NextResponse.json({ batch })
}
