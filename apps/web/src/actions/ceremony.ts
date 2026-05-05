"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getCeremony(weddingId: string) {
  return db.ceremonyDetail.findUnique({ where: { weddingId } })
}

export async function updateCeremony(weddingId: string, data: {
  officiantName?: string
  officiantContact?: string
  officiantEmail?: string
  location?: string
  dresscode?: string
  startTime?: string
  endTime?: string
  duration?: number
  partnerOneVows?: string
  partnerTwoVows?: string
  readings?: string
  processionalOrder?: string
  recessionalOrder?: string
  ceremonyMusic?: string
  programItems?: string
  unityDetails?: string
  notes?: string
}) {
  await requireAuth()

  const { startTime, endTime, ...rest } = data

  await db.ceremonyDetail.upsert({
    where: { weddingId },
    update: {
      ...rest,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    },
    create: {
      weddingId,
      ...rest,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    },
  })

  revalidatePath("/ceremony")
}
