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
    if (!member) return NextResponse.json({ members: [] })

    const partyMembers = await db.weddingPartyMember.findMany({
      where: { weddingId: member.weddingId },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ members: partyMembers })
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
    const partyMember = await db.weddingPartyMember.create({
      data: {
        weddingId: member.weddingId,
        name: body.name,
        role: body.role,
        side: body.side,
        email: body.email,
        phone: body.phone,
        duties: body.duties,
        notes: body.notes,
        outfitColor: body.outfitColor,
        outfitStyle: body.outfitStyle,
        outfitStore: body.outfitStore,
        outfitOrdered: body.outfitOrdered ?? false,
        outfitPickedUp: body.outfitPickedUp ?? false,
      },
    })

    return NextResponse.json({ member: partyMember })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const weddingMember = await getWeddingAccess(session.user.id)
    if (!weddingMember || weddingMember.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const partyMember = await db.weddingPartyMember.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.side !== undefined && { side: data.side }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.duties !== undefined && { duties: data.duties }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.outfitOrdered !== undefined && { outfitOrdered: data.outfitOrdered }),
        ...(data.outfitPickedUp !== undefined && { outfitPickedUp: data.outfitPickedUp }),
        ...(data.outfitColor !== undefined && { outfitColor: data.outfitColor }),
        ...(data.outfitStyle !== undefined && { outfitStyle: data.outfitStyle }),
        ...(data.outfitStore !== undefined && { outfitStore: data.outfitStore }),
      },
    })

    return NextResponse.json({ member: partyMember })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const weddingMember = await getWeddingAccess(session.user.id)
    if (!weddingMember || weddingMember.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    await db.weddingPartyMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
