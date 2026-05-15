"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function getEventAccess(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  return db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
}

export async function createTask(eventId: string, data: {
  title: string
  description?: string
  dueDate?: string
  priority?: string
  category?: string
  notes?: string
}) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const task = await db.task.create({
    data: {
      eventId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority ?? "MEDIUM",
      category: data.category,
      notes: data.notes,
    },
  })
  revalidatePath(`/events/${eventId}/tasks`)
  return { success: true, task }
}

export async function toggleTask(taskId: string, eventId: string, completed: boolean) {
  const member = await getEventAccess(eventId)
  if (!member) return { error: "Unauthorized" }

  await db.task.update({
    where: { id: taskId },
    data: {
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
    },
  })
  revalidatePath(`/events/${eventId}/tasks`)
  return { success: true }
}

export async function updateTask(taskId: string, eventId: string, data: {
  title?: string
  description?: string
  dueDate?: string | null
  priority?: string
  category?: string
  notes?: string
}) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
  })
  revalidatePath(`/events/${eventId}/tasks`)
  return { success: true }
}

export async function deleteTask(taskId: string, eventId: string) {
  const member = await getEventAccess(eventId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.task.delete({ where: { id: taskId } })
  revalidatePath(`/events/${eventId}/tasks`)
  return { success: true }
}
