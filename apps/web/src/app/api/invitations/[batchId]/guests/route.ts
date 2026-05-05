import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function POST(
  req: Request,
  { params }: { params: { batchId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { guestIds } = await req.json()
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    return NextResponse.json({ error: "No guests provided" }, { status: 400 })
  }

  const batch = await db.invitationBatch.findUnique({ where: { id: params.batchId } })
  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 })

  const existing = await db.invitation.findMany({
    where: { batchId: params.batchId, guestId: { in: guestIds } },
    select: { guestId: true },
  })
  const existingIds = new Set(existing.map((i) => i.guestId))

  await db.invitation.createMany({
    data: guestIds
      .filter((id: string) => !existingIds.has(id))
      .map((guestId: string) => ({ batchId: params.batchId, guestId })),
  })

  const updatedBatch = await db.invitationBatch.findUnique({
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
  return NextResponse.json({ batch: updatedBatch })
}
