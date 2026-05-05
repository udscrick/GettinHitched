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
      include: {
        wedding: { include: { receptionDetail: true } },
      },
    })

    if (!weddingMember) {
      return NextResponse.json({ error: "No wedding found" }, { status: 404 })
    }

    return NextResponse.json({
      reception: weddingMember.wedding.receptionDetail,
      weddingId: weddingMember.wedding.id,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
