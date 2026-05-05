import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const section = await db.websiteSection.findUnique({ where: { id: params.id } })
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.websiteSection.update({
    where: { id: params.id },
    data: { isVisible: !section.isVisible },
  })

  revalidatePath("/website")
  return NextResponse.json({ success: true })
}
