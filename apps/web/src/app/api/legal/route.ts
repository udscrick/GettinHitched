import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weddingMember = await db.weddingMember.findFirst({
      where: { userId: session.user.id },
      include: {
        wedding: { include: { legalChecklist: true } },
      },
    })

    if (!weddingMember) {
      return NextResponse.json({ error: "No wedding found" }, { status: 404 })
    }

    return NextResponse.json({
      legal: weddingMember.wedding.legalChecklist,
      weddingId: weddingMember.wedding.id,
    })
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
    const { weddingId, licenseDate, licenseExpiryDate, waitingPeriodDays, ...rest } = body

    const member = await db.weddingMember.findFirst({
      where: { weddingId, userId: session.user.id },
    })
    if (!member || member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = {
      ...rest,
      waitingPeriodDays: waitingPeriodDays ? parseInt(String(waitingPeriodDays)) : undefined,
      licenseDate: licenseDate ? new Date(licenseDate) : undefined,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
    }

    await db.legalChecklist.upsert({
      where: { weddingId },
      create: { weddingId, ...data },
      update: data,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
