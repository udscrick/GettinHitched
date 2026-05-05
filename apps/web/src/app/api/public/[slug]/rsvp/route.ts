import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const wedding = await db.wedding.findUnique({
      where: { slug: params.slug },
    })

    if (!wedding || !wedding.websiteEnabled) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await req.json()
    const { firstName, lastName, email, attending, dietary, message } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const rsvpStatus = attending === "yes" || attending === true ? "ATTENDING" : "DECLINED"

    // Find existing guest by email or create new
    let guest = email
      ? await db.guest.findFirst({
          where: { weddingId: wedding.id, email: email.toLowerCase() },
        })
      : null

    if (guest) {
      await db.guest.update({
        where: { id: guest.id },
        data: {
          rsvpStatus,
          rsvpRespondedAt: new Date(),
          dietaryRestriction: dietary ?? guest.dietaryRestriction,
        },
      })
    } else {
      await db.guest.create({
        data: {
          weddingId: wedding.id,
          firstName,
          lastName,
          email: email?.toLowerCase(),
          rsvpStatus,
          rsvpRespondedAt: new Date(),
          dietaryRestriction: dietary ?? undefined,
          notes: message ?? undefined,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
