"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { seedWedding } from "../../prisma/seed"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createWedding(data: {
  partnerOneName: string
  partnerTwoName: string
  weddingDate?: string
  city?: string
  state?: string
  totalBudget?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const slug = generateSlug(data.partnerOneName, data.partnerTwoName)

  const wedding = await db.wedding.create({
    data: {
      slug,
      partnerOneName: data.partnerOneName,
      partnerTwoName: data.partnerTwoName,
      weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
      city: data.city,
      state: data.state,
      totalBudget: data.totalBudget ?? "0",
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      },
    },
  })

  await seedWedding(wedding.id)

  return { success: true, weddingId: wedding.id }
}

export async function getActiveWedding(userId: string) {
  return db.wedding.findFirst({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function updateWedding(weddingId: string, data: Partial<{
  partnerOneName: string
  partnerTwoName: string
  weddingDate: string | null
  weddingTime: string | null
  weddingLocation: string | null
  city: string | null
  state: string | null
  totalBudget: string
  story: string | null
  engagementDate: string | null
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
      ...(data.weddingTime !== undefined && { weddingTime: data.weddingTime }),
      ...(data.weddingLocation !== undefined && { weddingLocation: data.weddingLocation }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.totalBudget !== undefined && { totalBudget: data.totalBudget }),
      ...(data.story !== undefined && { story: data.story }),
      ...(data.engagementDate !== undefined && {
        engagementDate: data.engagementDate ? new Date(data.engagementDate) : null,
      }),
      ...(data.websiteEnabled !== undefined && { websiteEnabled: data.websiteEnabled }),
      ...(data.websiteTheme !== undefined && { websiteTheme: data.websiteTheme }),
    },
  })

  revalidatePath("/dashboard")
  return { success: true, wedding: updated }
}
