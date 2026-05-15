"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"


async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

async function getEventAccess(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  return member ? event : null
}

export async function createEvent(weddingId: string, data: {
  name: string
  type: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  dresscode?: string
  notes?: string
}) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const count = await db.event.count({ where: { weddingId } })
  const event = await db.event.create({
    data: {
      weddingId,
      name: data.name,
      type: data.type,
      date: data.date ? new Date(data.date) : null,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      description: data.description,
      dresscode: data.dresscode,
      notes: data.notes,
      sortOrder: count,
    },
  })

  revalidatePath("/events")
  return { success: true, event }
}

export async function updateEvent(eventId: string, data: {
  name?: string
  type?: string
  date?: string | null
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  dresscode?: string
  notes?: string
}) {
  const event = await getEventAccess(eventId)
  if (!event) return { error: "Unauthorized" }

  const updated = await db.event.update({
    where: { id: eventId },
    data: {
      ...data,
      date: data.date !== undefined ? (data.date ? new Date(data.date) : null) : undefined,
    },
  })

  revalidatePath("/events")
  revalidatePath(`/events/${eventId}`)
  return { success: true, event: updated }
}

export async function deleteEvent(eventId: string) {
  const event = await getEventAccess(eventId)
  if (!event) return { error: "Unauthorized" }

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId },
    orderBy: { joinedAt: "asc" },
  })
  // Only OWNER / ADMIN can delete events
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return { error: "Unauthorized" }
  }

  await db.event.delete({ where: { id: eventId } })
  revalidatePath("/events")
  return { success: true }
}

export async function reorderEvents(weddingId: string, orderedIds: string[]) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await Promise.all(
    orderedIds.map((id, index) =>
      db.event.update({ where: { id }, data: { sortOrder: index } })
    )
  )
  revalidatePath("/events")
  return { success: true }
}

// Copy all guests from sourceEventId into targetEventId, resetting RSVP to PENDING
export async function importGuestsFromEvent(targetEventId: string, sourceEventId: string) {
  const [targetEvent, sourceEvent] = await Promise.all([
    getEventAccess(targetEventId),
    getEventAccess(sourceEventId),
  ])
  if (!targetEvent || !sourceEvent) return { error: "Unauthorized" }
  if (targetEvent.weddingId !== sourceEvent.weddingId) return { error: "Events must belong to the same project" }

  const sourceGuests = await db.guest.findMany({
    where: { eventId: sourceEventId },
  })

  let imported = 0
  for (const g of sourceGuests) {
    // Skip plus-ones (they'll be re-added if their primary guest is copied)
    if (g.isPlusOne) continue
    await db.guest.create({
      data: {
        eventId: targetEventId,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        isChild: g.isChild,
        side: g.side,
        dietaryRestriction: g.dietaryRestriction,
        dietaryNotes: g.dietaryNotes,
        address: g.address,
        city: g.city,
        state: g.state,
        zip: g.zip,
        country: g.country,
        notes: g.notes,
        rsvpStatus: "PENDING",
      },
    })
    imported++
  }

  revalidatePath(`/events/${targetEventId}/guests`)
  return { success: true, imported }
}
