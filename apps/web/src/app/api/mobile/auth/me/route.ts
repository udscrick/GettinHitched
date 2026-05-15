import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    })

    const weddingMember = await db.weddingMember.findFirst({
      where: { userId: session.user.id },
      include: {
        wedding: {
          include: {
            events: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    })

    return NextResponse.json({
      user,
      wedding: weddingMember?.wedding ?? null,
      events: weddingMember?.wedding?.events ?? [],
      role: weddingMember?.role ?? null,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
