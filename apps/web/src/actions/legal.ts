"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getLegal(weddingId: string) {
  return db.legalChecklist.findUnique({ where: { weddingId } })
}

export async function updateLegal(weddingId: string, data: {
  licenseState?: string
  licenseObtained?: boolean
  licenseDate?: string
  waitingPeriodDays?: number
  licenseExpiryDate?: string
  nameChangeItems?: string
  prenupStatus?: string
  prenupNotes?: string
  documentUrls?: string
  beneficiaryItems?: string
  notes?: string
}) {
  await requireAuth()
  const { licenseDate, licenseExpiryDate, ...rest } = data

  await db.legalChecklist.upsert({
    where: { weddingId },
    update: {
      ...rest,
      licenseDate: licenseDate ? new Date(licenseDate) : undefined,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
    },
    create: {
      weddingId,
      ...rest,
      licenseDate: licenseDate ? new Date(licenseDate) : undefined,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
    },
  })

  revalidatePath("/legal")
}
