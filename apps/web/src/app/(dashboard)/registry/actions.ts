"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

export async function createRegistryItem(weddingId: string, data: {
  name: string
  description?: string
  price?: string
  store?: string
  url?: string
  quantity?: number
  priority?: string
  category?: string
  isExternal?: boolean
}) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const item = await db.registryItem.create({
    data: {
      weddingId,
      name: data.name,
      description: data.description,
      price: data.price,
      store: data.store,
      url: data.url,
      quantity: data.quantity ?? 1,
      priority: data.priority ?? "MEDIUM",
      category: data.category,
      isExternal: data.isExternal ?? false,
    },
  })
  revalidatePath("/registry")
  return { success: true, item }
}

export async function deleteRegistryItem(itemId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.registryItem.delete({ where: { id: itemId } })
  revalidatePath("/registry")
  return { success: true }
}

export async function createGiftReceived(weddingId: string, data: {
  giverName: string
  description?: string
  value?: string
  registryItemId?: string
  guestId?: string
}) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const gift = await db.giftReceived.create({
    data: {
      weddingId,
      giverName: data.giverName,
      description: data.description,
      value: data.value,
      registryItemId: data.registryItemId ?? null,
      guestId: data.guestId ?? null,
      receivedAt: new Date(),
    },
  })

  // Increment purchased count on registry item
  if (data.registryItemId) {
    await db.registryItem.update({
      where: { id: data.registryItemId },
      data: { purchased: { increment: 1 } },
    })
  }

  revalidatePath("/registry")
  return { success: true, gift }
}

export async function updateThankYou(giftId: string, weddingId: string, sent: boolean) {
  const member = await getWeddingAccess(weddingId)
  if (!member) return { error: "Unauthorized" }

  await db.giftReceived.update({
    where: { id: giftId },
    data: {
      thankYouSent: sent,
      thankYouSentAt: sent ? new Date() : null,
    },
  })
  revalidatePath("/registry")
  return { success: true }
}
