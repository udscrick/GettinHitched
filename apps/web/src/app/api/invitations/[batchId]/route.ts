import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function DELETE(
  _req: Request,
  { params }: { params: { batchId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.invitationBatch.delete({ where: { id: params.batchId } })

  revalidatePath("/invitations")
  return NextResponse.json({ success: true })
}
