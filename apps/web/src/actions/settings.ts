"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { nanoid } from "nanoid"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function updateWeddingDetails(weddingId: string, data: {
  partnerOneName?: string
  partnerTwoName?: string
  weddingDate?: string
  weddingTime?: string
  weddingLocation?: string
  city?: string
  state?: string
  country?: string
  totalBudget?: string
  currency?: string
}) {
  await requireAuth()
  const { weddingDate, ...rest } = data

  await db.wedding.update({
    where: { id: weddingId },
    data: {
      ...rest,
      weddingDate: weddingDate ? new Date(weddingDate) : undefined,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/dashboard")
}

export async function getMembers(weddingId: string) {
  return db.weddingMember.findMany({
    where: { weddingId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { invitedAt: "asc" },
  })
}

export async function inviteMember(weddingId: string, email: string, role: string) {
  const userId = await requireAuth()

  const member = await db.weddingMember.findFirst({
    where: { weddingId, userId },
  })
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Not authorized to invite members")
  }

  const invitedUser = await db.user.findUnique({ where: { email } })
  if (!invitedUser) {
    throw new Error("No account found with that email address")
  }

  const existing = await db.weddingMember.findFirst({
    where: { weddingId, userId: invitedUser.id },
  })
  if (existing) throw new Error("This person is already a member")

  await db.weddingMember.create({
    data: {
      weddingId,
      userId: invitedUser.id,
      role,
      inviteToken: nanoid(),
      joinedAt: new Date(),
    },
  })

  revalidatePath("/settings")
}

export async function removeMember(memberId: string) {
  const userId = await requireAuth()

  const member = await db.weddingMember.findUnique({ where: { id: memberId } })
  if (!member) throw new Error("Member not found")

  const requester = await db.weddingMember.findFirst({
    where: { weddingId: member.weddingId, userId },
  })
  if (!requester || !["OWNER", "ADMIN"].includes(requester.role)) {
    throw new Error("Not authorized")
  }
  if (member.role === "OWNER") throw new Error("Cannot remove the owner")

  await db.weddingMember.delete({ where: { id: memberId } })
  revalidatePath("/settings")
}

export async function updateMemberRole(memberId: string, role: string) {
  const userId = await requireAuth()

  const member = await db.weddingMember.findUnique({ where: { id: memberId } })
  if (!member) throw new Error("Member not found")

  const requester = await db.weddingMember.findFirst({
    where: { weddingId: member.weddingId, userId },
  })
  if (!requester || requester.role !== "OWNER") {
    throw new Error("Only the owner can change roles")
  }

  await db.weddingMember.update({ where: { id: memberId }, data: { role } })
  revalidatePath("/settings")
}
