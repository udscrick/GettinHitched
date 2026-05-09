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

    const vendors = await db.vendor.findMany({
      where: { eventId: params.eventId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ vendors })
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
    const vendor = await db.vendor.create({
      data: {
        eventId: params.eventId,
        name: body.name,
        type: body.type ?? "OTHER",
        status: body.status ?? "RESEARCHING",
        email: body.email,
        phone: body.phone,
        website: body.website,
        contactPerson: body.contactPerson,
        price: body.price,
        notes: body.notes,
      },
    })

    return NextResponse.json({ vendor })
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
    if (!id) return NextResponse.json({ error: "Vendor id required" }, { status: 400 })

    const vendor = await db.vendor.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.depositPaid !== undefined && { depositPaid: data.depositPaid }),
        ...(data.depositAmount !== undefined && { depositAmount: data.depositAmount }),
      },
    })

    return NextResponse.json({ vendor })
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
    if (!id) return NextResponse.json({ error: "Vendor id required" }, { status: 400 })

    await db.vendor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
