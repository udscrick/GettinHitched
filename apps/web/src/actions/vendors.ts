"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { vendorSchema, vendorCommSchema } from "@/lib/validations/vendor"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

export async function createVendor(weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = vendorSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const vendor = await db.vendor.create({
    data: { weddingId, ...parsed.data },
  })
  revalidatePath("/vendors")
  return { success: true, vendor }
}

export async function updateVendor(vendorId: string, weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = vendorSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const vendor = await db.vendor.update({ where: { id: vendorId }, data: parsed.data })
  revalidatePath("/vendors")
  return { success: true, vendor }
}

export async function deleteVendor(vendorId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.vendor.delete({ where: { id: vendorId } })
  revalidatePath("/vendors")
  return { success: true }
}

export async function addVendorCommunication(vendorId: string, weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
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
  revalidatePath(`/vendors`)
  return { success: true, comm }
}
