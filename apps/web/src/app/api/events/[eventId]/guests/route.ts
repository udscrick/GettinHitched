import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function getAccess(eventId: string, userId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId },
  })
  return member ? { event, member } : null
}

export async function GET(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const guests = await db.guest.findMany({
      where: { eventId: params.eventId },
      include: { table: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ guests })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access || access.member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const guest = await db.guest.create({
      data: {
        eventId: params.eventId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        rsvpStatus: body.rsvpStatus ?? "PENDING",
        side: body.side ?? "BOTH",
        dietaryRestriction: body.dietaryRestriction,
        notes: body.notes,
        isChild: body.isChild ?? false,
      },
    })

    return NextResponse.json({ guest })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access || access.member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "Guest id required" }, { status: 400 })

    const guest = await db.guest.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.rsvpStatus !== undefined && { rsvpStatus: data.rsvpStatus, rsvpRespondedAt: new Date() }),
        ...(data.side !== undefined && { side: data.side }),
        ...(data.dietaryRestriction !== undefined && { dietaryRestriction: data.dietaryRestriction }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tableId !== undefined && { tableId: data.tableId }),
        ...(data.mealChoice !== undefined && { mealChoice: data.mealChoice }),
      },
    })

    return NextResponse.json({ guest })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access || access.member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Guest id required" }, { status: 400 })

    await db.guest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
