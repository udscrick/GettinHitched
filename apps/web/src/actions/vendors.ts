"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { vendorSchema, vendorCommSchema } from "@/lib/validations/vendor"

async function getEventAccess(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  return db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
}

export async function createVendor(eventId: string, data: unknown) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = vendorSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const vendor = await db.vendor.create({
    data: { eventId, ...parsed.data },
  })
  revalidatePath(`/events/${eventId}/vendors`)
  return { success: true, vendor }
}

export async function updateVendor(vendorId: string, eventId: string, data: unknown) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = vendorSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const vendor = await db.vendor.update({ where: { id: vendorId }, data: parsed.data })
  revalidatePath(`/events/${eventId}/vendors`)
  return { success: true, vendor }
}

export async function deleteVendor(vendorId: string, eventId: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.vendor.delete({ where: { id: vendorId } })
  revalidatePath(`/events/${eventId}/vendors`)
  return { success: true }
}

export async function addVendorCommunication(vendorId: string, eventId: string, data: unknown) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = vendorCommSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const comm = await db.vendorCommunication.create({
    data: {
      vendorId,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      summary: parsed.data.summary,
      followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null,
      notes: parsed.data.notes,
    },
  })
  revalidatePath(`/events/${eventId}/vendors`)
  return { success: true, comm }
}
