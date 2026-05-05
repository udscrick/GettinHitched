"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getReception(weddingId: string) {
  return db.receptionDetail.findUnique({ where: { weddingId } })
}

export async function updateReception(weddingId: string, data: {
  location?: string
  startTime?: string
  endTime?: string
  cocktailHourStart?: string
  cocktailHourEnd?: string
  eventTimeline?: string
  menu?: string
  barDetails?: string
  playlist?: string
  firstDanceSong?: string
  firstDanceArtist?: string
  parentDances?: string
  speeches?: string
  decorNotes?: string
  notes?: string
}) {
  await requireAuth()

  const { startTime, endTime, cocktailHourStart, cocktailHourEnd, ...rest } = data

  await db.receptionDetail.upsert({
    where: { weddingId },
    update: {
      ...rest,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      cocktailHourStart: cocktailHourStart ? new Date(cocktailHourStart) : undefined,
      cocktailHourEnd: cocktailHourEnd ? new Date(cocktailHourEnd) : undefined,
    },
    create: {
      weddingId,
      ...rest,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      cocktailHourStart: cocktailHourStart ? new Date(cocktailHourStart) : undefined,
      cocktailHourEnd: cocktailHourEnd ? new Date(cocktailHourEnd) : undefined,
    },
  })

  revalidatePath("/reception")
}
