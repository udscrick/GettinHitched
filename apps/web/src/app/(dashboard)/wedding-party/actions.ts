"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

type MemberData = {
  name: string
  email?: string
  phone?: string
  role: string
  side?: string
  dressSize?: string
  shoeSize?: string
  suitSize?: string
  waist?: string
  chest?: string
  inseam?: string
  outfitColor?: string
  outfitStyle?: string
  outfitOrdered?: boolean
  outfitPickedUp?: boolean
  duties?: string
  notes?: string
}

export async function createPartyMember(weddingId: string, data: MemberData) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const partyMember = await db.weddingPartyMember.create({
    data: { weddingId, ...data },
  })
  revalidatePath("/wedding-party")
  return { success: true, partyMember }
}

export async function updatePartyMember(memberId: string, weddingId: string, data: Partial<MemberData>) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const partyMember = await db.weddingPartyMember.update({
    where: { id: memberId },
    data,
  })
  revalidatePath("/wedding-party")
  return { success: true, partyMember }
}

export async function deletePartyMember(memberId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.weddingPartyMember.delete({ where: { id: memberId } })
  revalidatePath("/wedding-party")
  return { success: true }
}
