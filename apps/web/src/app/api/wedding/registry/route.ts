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
    if (!member) return NextResponse.json({ items: [], gifts: [] })

    const [items, gifts] = await Promise.all([
      db.registryItem.findMany({
        where: { weddingId: member.weddingId },
        orderBy: { sortOrder: "asc" },
      }),
      db.giftReceived.findMany({
        where: { weddingId: member.weddingId },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ items, gifts })
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

    if (body.type === "gift") {
      const gift = await db.giftReceived.create({
        data: {
          weddingId: member.weddingId,
          giverName: body.giverName,
          description: body.description,
          value: body.value,
          thankYouSent: body.thankYouSent ?? false,
          notes: body.notes,
        },
      })
      return NextResponse.json({ gift })
    }

    const item = await db.registryItem.create({
      data: {
        weddingId: member.weddingId,
        name: body.name,
        description: body.description,
        price: body.price,
        quantity: body.quantity ?? 1,
        url: body.url,
        store: body.store,
        priority: body.priority ?? "MEDIUM",
        category: body.category,
      },
    })

    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await getWeddingAccess(session.user.id)
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, type, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (type === "gift") {
      const gift = await db.giftReceived.update({
        where: { id },
        data: {
          ...(data.thankYouSent !== undefined && { thankYouSent: data.thankYouSent }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      })
      return NextResponse.json({ gift })
    }

    const item = await db.registryItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.purchased !== undefined && { purchased: data.purchased }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.price !== undefined && { price: data.price }),
      },
    })

    return NextResponse.json({ item })
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

    if (type === "gift") {
      await db.giftReceived.delete({ where: { id } })
    } else {
      await db.registryItem.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
