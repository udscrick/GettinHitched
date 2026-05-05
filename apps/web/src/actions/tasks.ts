"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

export async function createTask(weddingId: string, data: {
  title: string
  description?: string
  dueDate?: string
  priority?: string
  category?: string
  notes?: string
}) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const task = await db.task.create({
    data: {
      weddingId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority ?? "MEDIUM",
      category: data.category,
      notes: data.notes,
    },
  })
  revalidatePath("/tasks")
  return { success: true, task }
}

export async function toggleTask(taskId: string, weddingId: string, completed: boolean) {
  const member = await getWeddingAccess(weddingId)
  if (!member) return { error: "Unauthorized" }

  await db.task.update({
    where: { id: taskId },
    data: {
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
    },
  })
  revalidatePath("/tasks")
  return { success: true }
}

export async function updateTask(taskId: string, weddingId: string, data: {
  title?: string
  description?: string
  dueDate?: string | null
  priority?: string
  category?: string
  notes?: string
}) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
  })
  revalidatePath("/tasks")
  return { success: true }
}

export async function deleteTask(taskId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.task.delete({ where: { id: taskId } })
  revalidatePath("/tasks")
  return { success: true }
}
