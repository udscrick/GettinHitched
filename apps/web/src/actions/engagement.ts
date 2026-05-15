"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getEngagement(weddingId: string) {
  return db.engagementDetail.findUnique({ where: { weddingId } })
}

export async function updateEngagement(weddingId: string, data: {
  proposalDate?: string
  proposalLocation?: string
  proposalStory?: string
  ringDescription?: string
  whoProposed?: string
  announcementItems?: string
  engagementPartyDate?: string
  engagementPartyVenue?: string
  engagementPartyNotes?: string
  notes?: string
}) {
  await requireAuth()
  const { proposalDate, engagementPartyDate, ...rest } = data

  await db.engagementDetail.upsert({
    where: { weddingId },
    update: {
      ...rest,
      proposalDate: proposalDate ? new Date(proposalDate) : undefined,
      engagementPartyDate: engagementPartyDate ? new Date(engagementPartyDate) : undefined,
    },
    create: {
      weddingId,
      ...rest,
      proposalDate: proposalDate ? new Date(proposalDate) : undefined,
      engagementPartyDate: engagementPartyDate ? new Date(engagementPartyDate) : undefined,
    },
  })

  revalidatePath("/engagement")
}
