"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveReception(weddingId: string, data: {
  location?: string
  startTime?: string
  endTime?: string
  cocktailHourStart?: string
  cocktailHourEnd?: string
  notes?: string
  eventTimeline?: string
  menu?: string
  firstDanceSong?: string
  firstDanceArtist?: string
  parentDances?: string
  playlist?: string
  speeches?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const upsertData = {
    location: data.location,
    startTime: data.startTime ? new Date(data.startTime) : undefined,
    endTime: data.endTime ? new Date(data.endTime) : undefined,
    cocktailHourStart: data.cocktailHourStart ? new Date(data.cocktailHourStart) : undefined,
    cocktailHourEnd: data.cocktailHourEnd ? new Date(data.cocktailHourEnd) : undefined,
    notes: data.notes,
    eventTimeline: data.eventTimeline,
    menu: data.menu,
    firstDanceSong: data.firstDanceSong,
    firstDanceArtist: data.firstDanceArtist,
    parentDances: data.parentDances,
    playlist: data.playlist,
    speeches: data.speeches,
  }

  await db.receptionDetail.upsert({
    where: { weddingId },
    create: { weddingId, ...upsertData },
    update: upsertData,
  })

  revalidatePath("/reception")
  return { success: true }
}
