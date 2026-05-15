import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role = "EDITOR" } = await req.json()

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!weddingMember || !["OWNER", "ADMIN"].includes(weddingMember.role)) {
    return NextResponse.json({ error: "Not authorized to generate invite links" }, { status: 403 })
  }

  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const invite = await db.weddingInvite.create({
    data: {
      weddingId: weddingMember.weddingId,
      token,
      role,
      createdById: session.user.id,
      expiresAt,
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return NextResponse.json({
    inviteUrl: `${appUrl}/invite/${invite.token}`,
    expiresAt: invite.expiresAt,
  })
}
