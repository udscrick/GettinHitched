import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { weddingId, partnerOneName, partnerTwoName, weddingDate, weddingTime,
      weddingLocation, city, state, country, totalBudget, currency } = body

    const member = await db.weddingMember.findFirst({
      where: { weddingId, userId: session.user.id },
    })
    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const wedding = await db.wedding.update({
      where: { id: weddingId },
      data: {
        partnerOneName: partnerOneName || undefined,
        partnerTwoName: partnerTwoName || undefined,
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        weddingTime: weddingTime || undefined,
        weddingLocation: weddingLocation || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        totalBudget: totalBudget || undefined,
        currency: currency || undefined,
      },
    })

    return NextResponse.json({ wedding })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weddingMember = await db.weddingMember.findFirst({
      where: { userId: session.user.id },
      include: { wedding: true },
    })

    if (!weddingMember) {
      return NextResponse.json({ error: "No wedding found" }, { status: 404 })
    }

    const members = await db.weddingMember.findMany({
      where: { weddingId: weddingMember.weddingId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { invitedAt: "asc" },
    })

    return NextResponse.json({
      wedding: weddingMember.wedding,
      weddingId: weddingMember.weddingId,
      currentUserId: session.user.id,
      currentRole: weddingMember.role,
      members,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
