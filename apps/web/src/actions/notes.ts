"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getNotes(weddingId: string) {
  return db.note.findMany({
    where: { weddingId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  })
}

export async function createNote(weddingId: string, data: {
  title?: string
  content: string
  category?: string
}) {
  const userId = await requireAuth()

  await db.note.create({
    data: { weddingId, userId, ...data },
  })

  revalidatePath("/notes")
}

export async function updateNote(id: string, data: {
  title?: string
  content?: string
  category?: string
}) {
  await requireAuth()

  await db.note.update({ where: { id }, data })
  revalidatePath("/notes")
}

export async function deleteNote(id: string) {
  await requireAuth()
  await db.note.delete({ where: { id } })
  revalidatePath("/notes")
}

export async function togglePinNote(id: string) {
  await requireAuth()
  const note = await db.note.findUnique({ where: { id } })
  if (!note) throw new Error("Note not found")

  await db.note.update({ where: { id }, data: { isPinned: !note.isPinned } })
  revalidatePath("/notes")
}
