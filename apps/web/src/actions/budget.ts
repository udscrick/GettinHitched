"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { expenseSchema, categorySchema } from "@/lib/validations/budget"

async function getWeddingAccess(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({ where: { weddingId, userId: session.user.id } })
}

export async function createExpense(weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data
  const expense = await db.expense.create({
    data: {
      weddingId,
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      vendorId: d.vendorId,
      totalAmount: d.totalAmount,
      paidAmount: d.paidAmount,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      paidDate: d.paidDate ? new Date(d.paidDate) : null,
      status: d.status,
      isDeposit: d.isDeposit,
      notes: d.notes,
    },
    include: { category: true, vendor: true },
  })

  revalidatePath("/budget")
  return { success: true, expense }
}

export async function updateExpense(expenseId: string, weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = expenseSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data
  const expense = await db.expense.update({
    where: { id: expenseId },
    data: {
      ...d,
      dueDate: d.dueDate !== undefined ? (d.dueDate ? new Date(d.dueDate) : null) : undefined,
      paidDate: d.paidDate !== undefined ? (d.paidDate ? new Date(d.paidDate) : null) : undefined,
    },
  })

  revalidatePath("/budget")
  return { success: true, expense }
}

export async function deleteExpense(expenseId: string, weddingId: string) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.expense.delete({ where: { id: expenseId } })
  revalidatePath("/budget")
  return { success: true }
}

export async function createCategory(weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const category = await db.expenseCategory.create({
    data: { weddingId, ...parsed.data },
  })

  revalidatePath("/budget")
  return { success: true, category }
}

export async function updateCategory(categoryId: string, weddingId: string, data: unknown) {
  const member = await getWeddingAccess(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = categorySchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const category = await db.expenseCategory.update({
    where: { id: categoryId },
    data: parsed.data,
  })
  revalidatePath("/budget")
  return { success: true, category }
}
