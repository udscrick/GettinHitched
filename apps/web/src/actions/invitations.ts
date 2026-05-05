"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getInvitations(weddingId: string) {
  return db.invitationBatch.findMany({
    where: { weddingId },
    include: {
      invitations: {
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function createBatch(weddingId: string, data: {
  name: string
  type?: string
  method?: string
  rsvpDeadline?: string
  notes?: string
}) {
  await requireAuth()
  const { rsvpDeadline, ...rest } = data

  const batch = await db.invitationBatch.create({
    data: {
      weddingId,
      ...rest,
      rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : undefined,
    },
  })

  revalidatePath("/invitations")
  return batch
}

export async function addGuestsToBatch(batchId: string, guestIds: string[]) {
  await requireAuth()

  const existing = await db.invitation.findMany({
    where: { batchId, guestId: { in: guestIds } },
    select: { guestId: true },
  })
  const existingIds = new Set(existing.map((i) => i.guestId))

  await db.invitation.createMany({
    data: guestIds
      .filter((id) => !existingIds.has(id))
      .map((guestId) => ({ batchId, guestId })),
  })

  revalidatePath("/invitations")
}

export async function removeGuestFromBatch(invitationId: string) {
  await requireAuth()
  await db.invitation.delete({ where: { id: invitationId } })
  revalidatePath("/invitations")
}

export async function markBatchSent(batchId: string) {
  await requireAuth()
  const now = new Date()

  await db.invitationBatch.update({
    where: { id: batchId },
    data: { sentAt: now },
  })

  await db.invitation.updateMany({
    where: { batchId, sentAt: null },
    data: { sentAt: now, status: "SENT" },
  })

  revalidatePath("/invitations")
}

export async function deleteBatch(batchId: string) {
  await requireAuth()
  await db.invitationBatch.delete({ where: { id: batchId } })
  revalidatePath("/invitations")
}
