import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { weddingId, email, role } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 })

  const requester = await db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
  if (!requester || !["OWNER", "ADMIN"].includes(requester.role)) {
    return NextResponse.json({ error: "Not authorized to invite members" }, { status: 403 })
  }

  const invitedUser = await db.user.findUnique({ where: { email } })
  if (!invitedUser) {
    return NextResponse.json({ error: "No account found with that email address" }, { status: 404 })
  }

  const existing = await db.weddingMember.findFirst({
    where: { weddingId, userId: invitedUser.id },
  })
  if (existing) return NextResponse.json({ error: "This person is already a member" }, { status: 409 })

  const member = await db.weddingMember.create({
    data: {
      weddingId,
      userId: invitedUser.id,
      role: role ?? "EDITOR",
      inviteToken: nanoid(),
      joinedAt: new Date(),
    },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  revalidatePath("/settings")
  return NextResponse.json({ member })
}
