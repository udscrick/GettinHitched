"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getHoneymoon(weddingId: string) {
  return db.honeymoonPlan.findUnique({
    where: { weddingId },
    include: {
      destinations: { orderBy: { sortOrder: "asc" } },
      packingItems: { orderBy: { sortOrder: "asc" } },
    },
  })
}

export async function updateHoneymoon(honeymoonPlanId: string, data: {
  departureDate?: string
  returnDate?: string
  budget?: string
  notes?: string
}) {
  await requireAuth()
  const { departureDate, returnDate, ...rest } = data

  await db.honeymoonPlan.update({
    where: { id: honeymoonPlanId },
    data: {
      ...rest,
      departureDate: departureDate ? new Date(departureDate) : undefined,
      returnDate: returnDate ? new Date(returnDate) : undefined,
    },
  })

  revalidatePath("/honeymoon")
}

export async function addDestination(honeymoonPlanId: string, data: {
  name: string
  country?: string
  arrivalDate?: string
  departureDate?: string
  accommodation?: string
  accommodationUrl?: string
  confirmationNumber?: string
  flightInfo?: string
  activities?: string
  estimatedCost?: string
  isBooked?: boolean
  notes?: string
}) {
  await requireAuth()
  const { arrivalDate, departureDate, ...rest } = data

  const count = await db.honeymoonDestination.count({ where: { honeymoonPlanId } })

  await db.honeymoonDestination.create({
    data: {
      honeymoonPlanId,
      ...rest,
      arrivalDate: arrivalDate ? new Date(arrivalDate) : undefined,
      departureDate: departureDate ? new Date(departureDate) : undefined,
      sortOrder: count,
    },
  })

  revalidatePath("/honeymoon")
}

export async function updateDestination(id: string, data: {
  name?: string
  country?: string
  arrivalDate?: string
  departureDate?: string
  accommodation?: string
  accommodationUrl?: string
  confirmationNumber?: string
  flightInfo?: string
  activities?: string
  estimatedCost?: string
  isBooked?: boolean
  notes?: string
}) {
  await requireAuth()
  const { arrivalDate, departureDate, ...rest } = data

  await db.honeymoonDestination.update({
    where: { id },
    data: {
      ...rest,
      arrivalDate: arrivalDate ? new Date(arrivalDate) : undefined,
      departureDate: departureDate ? new Date(departureDate) : undefined,
    },
  })

  revalidatePath("/honeymoon")
}

export async function deleteDestination(id: string) {
  await requireAuth()
  await db.honeymoonDestination.delete({ where: { id } })
  revalidatePath("/honeymoon")
}

export async function addPackingItem(honeymoonPlanId: string, data: {
  name: string
  category?: string
  quantity?: number
  forWho?: string
}) {
  await requireAuth()
  const count = await db.packingItem.count({ where: { honeymoonPlanId } })

  await db.packingItem.create({
    data: { honeymoonPlanId, sortOrder: count, ...data },
  })

  revalidatePath("/honeymoon")
}

export async function togglePackingItem(id: string) {
  await requireAuth()
  const item = await db.packingItem.findUnique({ where: { id } })
  if (!item) throw new Error("Not found")

  await db.packingItem.update({
    where: { id },
    data: { isPacked: !item.isPacked },
  })

  revalidatePath("/honeymoon")
}

export async function deletePackingItem(id: string) {
  await requireAuth()
  await db.packingItem.delete({ where: { id } })
  revalidatePath("/honeymoon")
}
