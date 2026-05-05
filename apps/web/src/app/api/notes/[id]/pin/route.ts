import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const note = await db.note.findUnique({ where: { id: params.id } })
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const updated = await db.note.update({
      where: { id: params.id },
      data: { isPinned: !note.isPinned },
    })

    return NextResponse.json({ success: true, isPinned: updated.isPinned })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
