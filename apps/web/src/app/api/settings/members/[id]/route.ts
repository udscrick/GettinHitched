import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await db.weddingMember.findUnique({ where: { id: params.id } })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  if (member.role === "OWNER") return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 })

  const requester = await db.weddingMember.findFirst({
    where: { weddingId: member.weddingId, userId: session.user.id },
  })
  if (!requester || !["OWNER", "ADMIN"].includes(requester.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  await db.weddingMember.delete({ where: { id: params.id } })
  revalidatePath("/settings")
  return NextResponse.json({ success: true })
}
