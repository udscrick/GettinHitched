"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

export async function createVenue(weddingId: string, data: {
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
}) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const venue = await db.venue.create({
    data: {
      weddingId,
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
    },
  })
  revalidatePath("/venues")
  return { success: true, venue }
}

export async function updateVenue(venueId: string, weddingId: string, data: Partial<{
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
}>) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const venue = await db.venue.update({
    where: { id: venueId },
    data: {
      ...data,
      visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      bookingDate: data.bookingDate ? new Date(data.bookingDate) : undefined,
    },
  })
  revalidatePath("/venues")
  return { success: true, venue }
}

export async function deleteVenue(venueId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.venue.delete({ where: { id: venueId } })
  revalidatePath("/venues")
  return { success: true }
}

export async function updateVenueStatus(venueId: string, weddingId: string, status: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.venue.update({ where: { id: venueId }, data: { status } })
  revalidatePath("/venues")
  return { success: true }
}
