"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { guestSchema } from "@/lib/validations/guest"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
  return member
}

export async function createGuest(weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = guestSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const guest = await db.guest.create({
    data: { weddingId, ...parsed.data },
  })

  revalidatePath(`/guests`)
  return { success: true, guest }
}

export async function updateGuest(guestId: string, weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = guestSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const guest = await db.guest.update({
    where: { id: guestId },
    data: parsed.data,
  })

  revalidatePath(`/guests`)
  return { success: true, guest }
}

export async function deleteGuest(guestId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.guest.delete({ where: { id: guestId } })
  revalidatePath(`/guests`)
  return { success: true }
}

export async function updateGuestRSVP(guestId: string, weddingId: string, status: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member) return { error: "Unauthorized" }

  await db.guest.update({
    where: { id: guestId },
    data: { rsvpStatus: status, rsvpRespondedAt: new Date() },
  })
  revalidatePath(`/guests`)
  return { success: true }
}

export async function assignGuestToTable(guestId: string, tableId: string | null, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.guest.update({
    where: { id: guestId },
    data: { tableId },
  })
  revalidatePath(`/guests/seating`)
  return { success: true }
}

export async function createTable(weddingId: string, data: { name: string; capacity: number; shape?: string }) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const table = await db.table.create({
    data: { weddingId, ...data },
  })
  revalidatePath(`/guests/seating`)
  return { success: true, table }
}

export async function deleteTable(tableId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  // Unassign guests
  await db.guest.updateMany({ where: { tableId }, data: { tableId: null } })
  await db.table.delete({ where: { id: tableId } })
  revalidatePath(`/guests/seating`)
  return { success: true }
}
