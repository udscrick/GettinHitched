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
    })

    if (!weddingMember) {
      return NextResponse.json({ error: "No wedding found" }, { status: 404 })
    }

    const notes = await db.note.findMany({
      where: { weddingId: weddingMember.weddingId },
      include: { user: { select: { name: true, image: true } } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    })

    return NextResponse.json({ notes })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weddingMember = await db.weddingMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!weddingMember) {
      return NextResponse.json({ error: "No wedding found" }, { status: 404 })
    }

    const body = await req.json()
    const { title, content, category } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const note = await db.note.create({
      data: {
        weddingId: weddingMember.weddingId,
        userId: session.user.id,
        title: title || undefined,
        content,
        category: category || "general",
      },
      include: { user: { select: { name: true, image: true } } },
    })

    return NextResponse.json({ success: true, note })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
