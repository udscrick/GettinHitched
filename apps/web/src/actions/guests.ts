"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { guestSchema } from "@/lib/validations/guest"

async function getEventAccess(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  return member
}

export async function createGuest(eventId: string, data: unknown) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = guestSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const guest = await db.guest.create({
    data: { eventId, ...parsed.data },
  })

  revalidatePath(`/events/${eventId}/guests`)
  return { success: true, guest }
}

export async function updateGuest(guestId: string, eventId: string, data: unknown) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = guestSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const guest = await db.guest.update({
    where: { id: guestId },
    data: parsed.data,
  })

  revalidatePath(`/events/${eventId}/guests`)
  return { success: true, guest }
}

export async function deleteGuest(guestId: string, eventId: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.guest.delete({ where: { id: guestId } })
  revalidatePath(`/events/${eventId}/guests`)
  return { success: true }
}

export async function updateGuestRSVP(guestId: string, eventId: string, status: string) {
  const member = await getEventAccess(eventId)
  if (!member) return { error: "Unauthorized" }

  await db.guest.update({
    where: { id: guestId },
    data: { rsvpStatus: status, rsvpRespondedAt: new Date() },
  })
  revalidatePath(`/events/${eventId}/guests`)
  return { success: true }
}

export async function assignGuestToTable(guestId: string, tableId: string | null, eventId: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.guest.update({
    where: { id: guestId },
    data: { tableId },
  })
  revalidatePath(`/events/${eventId}/guests/seating`)
  return { success: true }
}

export async function createTable(eventId: string, data: { name: string; capacity: number; shape?: string }) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const table = await db.table.create({
    data: { eventId, ...data },
  })
  revalidatePath(`/events/${eventId}/guests/seating`)
  return { success: true, table }
}

export async function deleteTable(tableId: string, eventId: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.guest.updateMany({ where: { tableId }, data: { tableId: null } })
  await db.table.delete({ where: { id: tableId } })
  revalidatePath(`/events/${eventId}/guests/seating`)
  return { success: true }
}
