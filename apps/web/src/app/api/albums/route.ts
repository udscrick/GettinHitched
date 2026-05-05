import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { weddingId, name, category, description } = body

    if (!weddingId || !name) {
      return NextResponse.json({ error: "weddingId and name are required" }, { status: 400 })
    }

    const member = await db.weddingMember.findFirst({
      where: { weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const album = await db.album.create({
      data: {
        weddingId,
        name,
        category: category ?? "GENERAL",
        description: description ?? undefined,
      },
      include: { photos: true },
    })

    return NextResponse.json({ success: true, album })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
