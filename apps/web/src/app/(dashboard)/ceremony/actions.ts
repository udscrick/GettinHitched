"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveCeremony(weddingId: string, data: {
  officiantName?: string
  officiantContact?: string
  officiantEmail?: string
  startTime?: string
  duration?: number
  location?: string
  dresscode?: string
  partnerOneVows?: string
  partnerTwoVows?: string
  programItems?: string
  processionalOrder?: string
  ceremonyMusic?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const upsertData = {
    officiantName: data.officiantName,
    officiantContact: data.officiantContact,
    officiantEmail: data.officiantEmail,
    startTime: data.startTime ? new Date(data.startTime) : undefined,
    duration: data.duration,
    location: data.location,
    dresscode: data.dresscode,
    partnerOneVows: data.partnerOneVows,
    partnerTwoVows: data.partnerTwoVows,
    programItems: data.programItems,
    processionalOrder: data.processionalOrder,
    ceremonyMusic: data.ceremonyMusic,
  }

  await db.ceremonyDetail.upsert({
    where: { weddingId },
    create: { weddingId, ...upsertData },
    update: upsertData,
  })

  revalidatePath("/ceremony")
  return { success: true }
}
