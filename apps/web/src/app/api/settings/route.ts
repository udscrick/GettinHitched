import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weddingMember = await db.weddingMember.findFirst({
      where: { userId: session.user.id },
      include: { wedding: true },
    })

    if (!weddingMember) {
      return NextResponse.json({ error: "No wedding found" }, { status: 404 })
    }

    const members = await db.weddingMember.findMany({
      where: { weddingId: weddingMember.weddingId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { invitedAt: "asc" },
    })

    return NextResponse.json({
      wedding: weddingMember.wedding,
      weddingId: weddingMember.weddingId,
      role: weddingMember.role,
      members,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
