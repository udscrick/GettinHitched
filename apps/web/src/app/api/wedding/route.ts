import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const weddingMember = await db.weddingMember.findFirst({
      where: { userId: session.user.id },
      include: {
        wedding: {
          include: {
            events: { orderBy: { sortOrder: "asc" } },
            members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          },
        },
      },
    })

    return NextResponse.json({
      wedding: weddingMember?.wedding ?? null,
      role: weddingMember?.role ?? null,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await db.weddingMember.findFirst({ where: { userId: session.user.id } })
    if (existing) return NextResponse.json({ error: "Wedding already exists" }, { status: 409 })

    const body = await req.json()
    const { partnerOneName, partnerTwoName, weddingDate, city, state } = body

    const slug = generateSlug(partnerOneName, partnerTwoName)
    const wedding = await db.wedding.create({
      data: {
        slug,
        partnerOneName,
        partnerTwoName,
        weddingDate: weddingDate ? new Date(weddingDate) : null,
        city,
        state,
        members: {
          create: { userId: session.user.id, role: "OWNER", joinedAt: new Date() },
        },
      },
    })

    await Promise.all([
      db.legalChecklist.create({ data: { weddingId: wedding.id } }),
      db.honeymoonPlan.create({ data: { weddingId: wedding.id } }),
      db.engagementDetail.create({ data: { weddingId: wedding.id } }),
    ])

    const sections = [
      { type: "hero", title: "Welcome", sortOrder: 0 },
      { type: "our_story", title: "Our Story", sortOrder: 1 },
      { type: "schedule", title: "Wedding Schedule", sortOrder: 2 },
      { type: "registry", title: "Gift Registry", sortOrder: 3 },
      { type: "travel", title: "Travel & Accommodations", sortOrder: 4 },
      { type: "faq", title: "FAQ", sortOrder: 5 },
    ]
    for (const s of sections) {
      await db.websiteSection.create({ data: { weddingId: wedding.id, ...s } })
    }

    return NextResponse.json({ wedding })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const member = await db.weddingMember.findFirst({ where: { userId: session.user.id } })
    if (!member || member.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const wedding = await db.wedding.update({
      where: { id: member.weddingId },
      data: {
        ...(body.partnerOneName && { partnerOneName: body.partnerOneName }),
        ...(body.partnerTwoName && { partnerTwoName: body.partnerTwoName }),
        ...(body.weddingDate !== undefined && {
          weddingDate: body.weddingDate ? new Date(body.weddingDate) : null,
        }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.story !== undefined && { story: body.story }),
        ...(body.websiteEnabled !== undefined && { websiteEnabled: body.websiteEnabled }),
        ...(body.websiteTheme !== undefined && { websiteTheme: body.websiteTheme }),
      },
    })

    return NextResponse.json({ wedding })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
