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
  if (!member) return NextResponse.json({ weddingId: null, settings: null, sections: [] })

  const [wedding, sections] = await Promise.all([
    db.wedding.findUnique({
      where: { id: member.weddingId },
      select: {
        id: true,
        slug: true,
        websiteEnabled: true,
        websiteTheme: true,
        websiteTitle: true,
        websiteMessage: true,
        story: true,
      },
    }),
    db.websiteSection.findMany({
      where: { weddingId: member.weddingId },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  return NextResponse.json({
    weddingId: member.weddingId,
    slug: wedding?.slug,
    settings: wedding,
    sections,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { weddingId, websiteEnabled, websiteTheme, websiteTitle, websiteMessage, story } = await req.json()

  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await db.wedding.update({
    where: { id: weddingId },
    data: { websiteEnabled, websiteTheme, websiteTitle, websiteMessage, story },
  })

  revalidatePath("/website")
  return NextResponse.json({ success: true })
}
