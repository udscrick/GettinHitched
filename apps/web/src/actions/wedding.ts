"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createWedding(data: {
  partnerOneName: string
  partnerTwoName: string
  weddingDate?: string
  city?: string
  state?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const userExists = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!userExists) return { error: "Session expired — please sign out and sign in again" }

  const slug = generateSlug(data.partnerOneName, data.partnerTwoName)

  const wedding = await db.wedding.create({
    data: {
      slug,
      partnerOneName: data.partnerOneName,
      partnerTwoName: data.partnerTwoName,
      weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
      city: data.city,
      state: data.state,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      },
    },
  })

  // Seed project-level defaults (legal, engagement, honeymoon, website sections)
  await db.legalChecklist.create({ data: { weddingId: wedding.id } })
  await db.honeymoonPlan.create({ data: { weddingId: wedding.id } })
  await db.engagementDetail.create({ data: { weddingId: wedding.id } })

  const websiteSections = [
    { type: "hero", title: "Welcome", sortOrder: 0 },
    { type: "our_story", title: "Our Story", sortOrder: 1 },
    { type: "schedule", title: "Wedding Schedule", sortOrder: 2 },
    { type: "registry", title: "Gift Registry", sortOrder: 3 },
    { type: "travel", title: "Travel & Accommodations", sortOrder: 4 },
    { type: "faq", title: "FAQ", sortOrder: 5 },
  ]
  for (const section of websiteSections) {
    await db.websiteSection.create({ data: { weddingId: wedding.id, ...section } })
  }

  return { success: true, weddingId: wedding.id }
}

export async function getActiveWedding(userId: string) {
  return db.wedding.findFirst({
    where: { members: { some: { userId } } },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  })
}

export async function updateWedding(weddingId: string, data: Partial<{
  partnerOneName: string
  partnerTwoName: string
  weddingDate: string | null
  city: string | null
  state: string | null
  story: string | null
  websiteEnabled: boolean
  websiteTheme: string
}>) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const updated = await db.wedding.update({
    where: { id: weddingId },
    data: {
      ...(data.partnerOneName && { partnerOneName: data.partnerOneName }),
      ...(data.partnerTwoName && { partnerTwoName: data.partnerTwoName }),
      ...(data.weddingDate !== undefined && {
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
      }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.story !== undefined && { story: data.story }),
      ...(data.websiteEnabled !== undefined && { websiteEnabled: data.websiteEnabled }),
      ...(data.websiteTheme !== undefined && { websiteTheme: data.websiteTheme }),
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/settings")
  return { success: true, wedding: updated }
}
