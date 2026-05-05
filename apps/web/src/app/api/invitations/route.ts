import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { invitedAt: "asc" },
  })
  if (!member) return NextResponse.json({ batches: [], guests: [] })

  const [batches, guests] = await Promise.all([
    db.invitationBatch.findMany({
      where: { weddingId: member.weddingId },
      include: {
        invitations: {
          include: {
            guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.guest.findMany({
      where: { weddingId: member.weddingId },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ])

  return NextResponse.json({ batches, guests })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, type, method, rsvpDeadline, notes } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const member = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { invitedAt: "asc" },
  })
  if (!member) return NextResponse.json({ error: "No wedding found" }, { status: 404 })

  const batch = await db.invitationBatch.create({
    data: {
      weddingId: member.weddingId,
      name,
      type: type ?? "WEDDING",
      method: method ?? "MAIL",
      rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : undefined,
      notes: notes || null,
    },
    include: { invitations: { include: { guest: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
  })

  revalidatePath("/invitations")
  return NextResponse.json({ batch })
}
