import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function getWeddingAccess(userId: string) {
  return db.weddingMember.findFirst({ where: { userId } })
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await getWeddingAccess(session.user.id)
    if (!member) return NextResponse.json({ plan: null })

    const plan = await db.honeymoonPlan.findUnique({
      where: { weddingId: member.weddingId },
      include: {
        destinations: { orderBy: { sortOrder: "asc" } },
        packingItems: { orderBy: { sortOrder: "asc" } },
      },
    })

    return NextResponse.json({ plan })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await getWeddingAccess(session.user.id)
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const plan = await db.honeymoonPlan.upsert({
      where: { weddingId: member.weddingId },
      update: {
        ...(body.departureDate !== undefined && {
          departureDate: body.departureDate ? new Date(body.departureDate) : null,
        }),
        ...(body.returnDate !== undefined && {
          returnDate: body.returnDate ? new Date(body.returnDate) : null,
        }),
        ...(body.budget !== undefined && { budget: body.budget }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      create: {
        weddingId: member.weddingId,
        departureDate: body.departureDate ? new Date(body.departureDate) : null,
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        budget: body.budget,
        notes: body.notes,
      },
    })

    return NextResponse.json({ plan })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await getWeddingAccess(session.user.id)
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const plan = await db.honeymoonPlan.findUnique({ where: { weddingId: member.weddingId } })
    if (!plan) return NextResponse.json({ error: "No honeymoon plan found" }, { status: 404 })

    if (body.type === "packing") {
      const item = await db.packingItem.create({
        data: {
          honeymoonPlanId: plan.id,
          name: body.name,
          category: body.category,
          quantity: body.quantity ?? 1,
          forWho: body.forWho ?? "BOTH",
          isPacked: body.isPacked ?? false,
        },
      })
      return NextResponse.json({ item })
    }

    const destination = await db.honeymoonDestination.create({
      data: {
        honeymoonPlanId: plan.id,
        name: body.name,
        country: body.country,
        accommodation: body.accommodation,
        estimatedCost: body.estimatedCost,
        isBooked: body.isBooked ?? false,
        notes: body.notes,
      },
    })

    return NextResponse.json({ destination })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await getWeddingAccess(session.user.id)
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (type === "packing") {
      await db.packingItem.delete({ where: { id } })
    } else {
      await db.honeymoonDestination.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
