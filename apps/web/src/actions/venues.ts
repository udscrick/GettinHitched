"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function getEventAccess(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  return db.weddingMember.findFirst({ where: { weddingId: event.weddingId, userId: session.user.id } })
}

export async function createVenue(eventId: string, data: {
  name: string
  address?: string
  city?: string
  state?: string
  website?: string
  contactPerson?: string
  email?: string
  phone?: string
  capacity?: number
  rentalFeeMin?: string
  rentalFeeMax?: string
  cateringType?: string
  parkingAvailable?: boolean
  outdoorAvailable?: boolean
  indoorAvailable?: boolean
  type?: string
  notes?: string
  pros?: string
  cons?: string
  rating?: number
  costItems?: string
  contractUrl?: string
  photoUrls?: string
  visitDate?: string
  bookingDate?: string
  depositPaid?: boolean
  depositAmount?: string
}) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const venue = await db.venue.create({
    data: {
      eventId,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      website: data.website,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      capacity: data.capacity,
      rentalFeeMin: data.rentalFeeMin,
      rentalFeeMax: data.rentalFeeMax,
      cateringType: data.cateringType,
      parkingAvailable: data.parkingAvailable ?? false,
      outdoorAvailable: data.outdoorAvailable ?? false,
      indoorAvailable: data.indoorAvailable ?? true,
      type: data.type ?? "BOTH",
      notes: data.notes,
      pros: data.pros,
      cons: data.cons,
      rating: data.rating,
      costItems: data.costItems,
      contractUrl: data.contractUrl,
      photoUrls: data.photoUrls,
      visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      bookingDate: data.bookingDate ? new Date(data.bookingDate) : undefined,
      depositPaid: data.depositPaid ?? false,
      depositAmount: data.depositAmount,
    },
  })
  revalidatePath(`/events/${eventId}/venue`)
  return { success: true, venue }
}

export async function updateVenue(venueId: string, eventId: string, data: Partial<{
  name: string
  address: string
  city: string
  state: string
  website: string
  contactPerson: string
  email: string
  phone: string
  capacity: number
  rentalFeeMin: string
  rentalFeeMax: string
  status: string
  cateringType: string
  parkingAvailable: boolean
  notes: string
  pros: string
  cons: string
  rating: number
  visitDate: string
  bookingDate: string
  depositPaid: boolean
  depositAmount: string
  costItems: string
  contractUrl: string
  photoUrls: string
}>) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const venue = await db.venue.update({
    where: { id: venueId },
    data: {
      ...data,
      visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      bookingDate: data.bookingDate ? new Date(data.bookingDate) : undefined,
    },
  })
  revalidatePath(`/events/${eventId}/venue`)
  return { success: true, venue }
}

export async function deleteVenue(venueId: string, eventId: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.venue.delete({ where: { id: venueId } })
  revalidatePath(`/events/${eventId}/venue`)
  return { success: true }
}

export async function updateVenueStatus(venueId: string, eventId: string, status: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.venue.update({ where: { id: venueId }, data: { status } })
  revalidatePath(`/events/${eventId}/venue`)
  return { success: true }
}
