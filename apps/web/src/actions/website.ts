"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getWebsite(weddingId: string) {
  const [wedding, sections] = await Promise.all([
    db.wedding.findUnique({
      where: { id: weddingId },
      select: {
        websiteEnabled: true,
        websiteTheme: true,
        websiteTitle: true,
        websiteMessage: true,
        slug: true,
        partnerOneName: true,
        partnerTwoName: true,
        weddingDate: true,
        city: true,
        state: true,
        story: true,
      },
    }),
    db.websiteSection.findMany({
      where: { weddingId },
      orderBy: { sortOrder: "asc" },
    }),
  ])
  return { wedding, sections }
}

export async function updateWebsiteSettings(weddingId: string, data: {
  websiteEnabled?: boolean
  websiteTheme?: string
  websiteTitle?: string
  websiteMessage?: string
  story?: string
}) {
  await requireAuth()

  await db.wedding.update({ where: { id: weddingId }, data })
  revalidatePath("/website")
  revalidatePath("/")
}

export async function updateWebsiteSection(id: string, data: {
  title?: string
  content?: string
  isVisible?: boolean
  config?: string
}) {
  await requireAuth()
  await db.websiteSection.update({ where: { id }, data })
  revalidatePath("/website")
}

export async function toggleWebsiteSection(id: string) {
  await requireAuth()
  const section = await db.websiteSection.findUnique({ where: { id } })
  if (!section) throw new Error("Section not found")

  await db.websiteSection.update({
    where: { id },
    data: { isVisible: !section.isVisible },
  })
  revalidatePath("/website")
}

export async function reorderSections(ids: string[]) {
  await requireAuth()

  await Promise.all(
    ids.map((id, index) =>
      db.websiteSection.update({ where: { id }, data: { sortOrder: index } })
    )
  )

  revalidatePath("/website")
}
