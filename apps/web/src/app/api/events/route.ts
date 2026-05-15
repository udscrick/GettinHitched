import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await db.weddingMember.findFirst({ where: { userId: session.user.id } })
    if (!member) return NextResponse.json({ events: [] })

    const events = await db.event.findMany({
      where: { weddingId: member.weddingId },
      include: {
        _count: { select: { guests: true, tasks: true, vendors: true, expenses: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await db.weddingMember.findFirst({ where: { userId: session.user.id } })
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const event = await db.event.create({
      data: {
        weddingId: member.weddingId,
        name: body.name,
        type: body.type ?? "CUSTOM",
        date: body.date ? new Date(body.date) : null,
        location: body.location,
        description: body.description,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    return NextResponse.json({ event })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "Event id required" }, { status: 400 })

    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const member = await db.weddingMember.findFirst({
      where: { weddingId: event.weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const updated = await db.event.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.date !== undefined && { date: data.date ? new Date(data.date) : null }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.description !== undefined && { description: data.description }),
      },
    })

    return NextResponse.json({ event: updated })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Event id required" }, { status: 400 })

    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const member = await db.weddingMember.findFirst({
      where: { weddingId: event.weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await db.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
