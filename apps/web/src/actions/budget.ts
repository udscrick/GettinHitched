"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { expenseSchema, categorySchema } from "@/lib/validations/budget"

async function getEventAccess(eventId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  return member ? { member, weddingId: event.weddingId } : null
}

export async function createExpense(eventId: string, data: unknown) {
  const access = await getEventAccess(eventId)
  if (!access || access.member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data
  const expense = await db.expense.create({
    data: {
      eventId,
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      vendorName: d.vendorName,
      amount: d.amount,
      expenseDate: d.expenseDate ? new Date(d.expenseDate) : null,
      paymentStatus: d.paymentStatus,
      paidBy: d.paidBy,
      notes: d.notes,
    },
    include: { category: true },
  })

  revalidatePath(`/events/${eventId}/budget`)
  return { success: true, expense }
}

export async function updateExpense(expenseId: string, eventId: string, data: unknown) {
  const access = await getEventAccess(eventId)
  if (!access || access.member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = expenseSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data
  const expense = await db.expense.update({
    where: { id: expenseId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
      ...(d.vendorName !== undefined && { vendorName: d.vendorName }),
      ...(d.amount !== undefined && { amount: d.amount }),
      ...(d.paymentStatus !== undefined && { paymentStatus: d.paymentStatus }),
      ...(d.paidBy !== undefined && { paidBy: d.paidBy }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.expenseDate !== undefined && {
        expenseDate: d.expenseDate ? new Date(d.expenseDate) : null,
      }),
    },
  })

  revalidatePath(`/events/${eventId}/budget`)
  return { success: true, expense }
}

export async function deleteExpense(expenseId: string, eventId: string) {
  const access = await getEventAccess(eventId)
  if (!access || access.member.role === "VIEWER") return { error: "Unauthorized" }

  await db.expense.delete({ where: { id: expenseId } })
  revalidatePath(`/events/${eventId}/budget`)
  return { success: true }
}

export async function createCategory(eventId: string, data: unknown) {
  const access = await getEventAccess(eventId)
  if (!access || access.member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const category = await db.expenseCategory.create({
    data: { weddingId: access.weddingId, ...parsed.data },
  })

  revalidatePath(`/events/${eventId}/budget`)
  return { success: true, category }
}

export async function updateCategory(categoryId: string, eventId: string, data: unknown) {
  const access = await getEventAccess(eventId)
  if (!access || access.member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = categorySchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const category = await db.expenseCategory.update({
    where: { id: categoryId },
    data: parsed.data,
  })
  revalidatePath(`/events/${eventId}/budget`)
  return { success: true, category }
}

export async function deleteCategory(categoryId: string, eventId: string) {
  const access = await getEventAccess(eventId)
  if (!access || access.member.role === "VIEWER") return { error: "Unauthorized" }

  await db.expenseCategory.delete({ where: { id: categoryId } })
  revalidatePath(`/events/${eventId}/budget`)
  return { success: true }
}
