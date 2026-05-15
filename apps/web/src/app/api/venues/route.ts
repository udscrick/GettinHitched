import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 })
    }

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const member = await db.weddingMember.findFirst({
      where: { weddingId: event.weddingId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const venues = await db.venue.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ venues, eventId, role: member.role })
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

    const body = await req.json()
    const { eventId, ...data } = body
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const member = await db.weddingMember.findFirst({
      where: { weddingId: event.weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const venue = await db.venue.create({ data: { eventId, ...data } })
    return NextResponse.json({ venue })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, eventId, ...data } = body
    if (!id || !eventId) return NextResponse.json({ error: "id and eventId required" }, { status: 400 })

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const member = await db.weddingMember.findFirst({
      where: { weddingId: event.weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const venue = await db.venue.update({ where: { id }, data })
    return NextResponse.json({ venue })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const eventId = searchParams.get("eventId")
    if (!id || !eventId) return NextResponse.json({ error: "id and eventId required" }, { status: 400 })

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const member = await db.weddingMember.findFirst({
      where: { weddingId: event.weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.venue.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
