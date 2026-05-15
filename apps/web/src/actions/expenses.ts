"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  expenseSchema,
  categorySchema,
  splitConfigSchema,
  commentSchema,
} from "@/lib/validations/expenses"

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getWeddingMember(weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.weddingMember.findFirst({
    where: { weddingId, userId: session.user.id },
  })
}

async function getMemberForExpense(expenseId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: { event: true },
  })
  if (!expense) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId: expense.event.weddingId, userId: session.user.id },
  })
  return member ? { member, expense } : null
}

async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

// ─── Expense CRUD ─────────────────────────────────────────────────────────────

export async function getExpenses(weddingId: string, eventId?: string) {
  const member = await getWeddingMember(weddingId)
  if (!member) return { error: "Unauthorized" }

  const where = eventId ? { eventId, event: { weddingId } } : { event: { weddingId } }
  const expenses = await db.expense.findMany({
    where,
    include: {
      category: true,
      vendor: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return { expenses }
}

export async function createExpense(weddingId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const member = await getWeddingMember(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  const d = parsed.data

  // Verify the eventId belongs to this wedding
  const event = await db.event.findFirst({
    where: { id: d.eventId, weddingId },
  })
  if (!event) return { error: "Event not found" }

  const expense = await db.expense.create({
    data: {
      eventId: d.eventId,
      title: d.title,
      amount: d.amount,
      currency: d.currency,
      paidBy: d.paidBy || null,
      expenseDate: d.expenseDate ? new Date(d.expenseDate) : null,
      paymentStatus: d.paymentStatus,
      categoryId: d.categoryId || null,
      vendorId: d.vendorId || null,
      vendorName: d.vendorName || null,
      notes: d.notes || null,
      description: d.description || null,
    },
    include: { category: true, vendor: true, event: true },
  })

  // Log activity
  await db.expenseActivity.create({
    data: {
      weddingId,
      expenseId: expense.id,
      userId: session.user.id,
      action: "CREATED",
      details: `Added expense: ${d.title} — ₹${d.amount}`,
    },
  })

  revalidatePath("/budget")
  return { success: true, expense }
}

export async function updateExpense(expenseId: string, weddingId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const member = await getWeddingMember(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = expenseSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  const d = parsed.data

  const expense = await db.expense.update({
    where: { id: expenseId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.amount !== undefined && { amount: d.amount }),
      ...(d.currency !== undefined && { currency: d.currency }),
      ...(d.paidBy !== undefined && { paidBy: d.paidBy || null }),
      ...(d.expenseDate !== undefined && {
        expenseDate: d.expenseDate ? new Date(d.expenseDate) : null,
      }),
      ...(d.paymentStatus !== undefined && { paymentStatus: d.paymentStatus }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId || null }),
      ...(d.vendorId !== undefined && { vendorId: d.vendorId || null }),
      ...(d.vendorName !== undefined && { vendorName: d.vendorName || null }),
      ...(d.notes !== undefined && { notes: d.notes || null }),
      ...(d.description !== undefined && { description: d.description || null }),
      ...(d.eventId !== undefined && { eventId: d.eventId }),
    },
    include: { category: true, vendor: true, event: true },
  })

  await db.expenseActivity.create({
    data: {
      weddingId,
      expenseId: expense.id,
      userId: session.user.id,
      action: "UPDATED",
      details: `Updated expense: ${expense.title}`,
    },
  })

  revalidatePath("/budget")
  return { success: true, expense }
}

export async function deleteExpense(expenseId: string, weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const member = await getWeddingMember(weddingId)
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN" && member.role !== "EDITOR"))
    return { error: "Unauthorized" }

  const expense = await db.expense.findUnique({ where: { id: expenseId } })
  if (!expense) return { error: "Not found" }

  await db.expense.delete({ where: { id: expenseId } })

  await db.expenseActivity.create({
    data: {
      weddingId,
      expenseId: null,
      userId: session.user.id,
      action: "DELETED",
      details: `Deleted expense: ${expense.title}`,
    },
  })

  revalidatePath("/budget")
  return { success: true }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(weddingId: string) {
  const member = await getWeddingMember(weddingId)
  if (!member) return { error: "Unauthorized" }

  const categories = await db.expenseCategory.findMany({
    where: { weddingId },
    orderBy: { sortOrder: "asc" },
  })
  return { categories }
}

export async function createCategory(weddingId: string, data: unknown) {
  const member = await getWeddingMember(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const count = await db.expenseCategory.count({ where: { weddingId } })
  const category = await db.expenseCategory.create({
    data: { weddingId, ...parsed.data, sortOrder: count },
  })

  revalidatePath("/budget")
  return { success: true, category }
}

export async function updateCategory(categoryId: string, weddingId: string, data: unknown) {
  const member = await getWeddingMember(weddingId)
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

export async function deleteCategory(categoryId: string, weddingId: string) {
  const member = await getWeddingMember(weddingId)
  if (!member || member.role === "VIEWER") return { error: "Unauthorized" }

  await db.expenseCategory.delete({ where: { id: categoryId } })
  revalidatePath("/budget")
  return { success: true }
}

// Seed default categories for a wedding (called on first visit if none exist)
export async function seedDefaultCategories(weddingId: string) {
  const member = await getWeddingMember(weddingId)
  if (!member) return { error: "Unauthorized" }

  const existing = await db.expenseCategory.count({ where: { weddingId } })
  if (existing > 0) return { success: true, seeded: false }

  const defaults = [
    { name: "Venue", color: "#7C3AED" },
    { name: "Catering", color: "#D97706" },
    { name: "Décor", color: "#DB2777" },
    { name: "Photography", color: "#0891B2" },
    { name: "Music", color: "#059669" },
    { name: "Attire", color: "#C9A96E" },
    { name: "Jewellery", color: "#F59E0B" },
    { name: "Travel", color: "#3B82F6" },
    { name: "Invitations", color: "#8B5CF6" },
    { name: "Makeup", color: "#EC4899" },
    { name: "Gifts", color: "#10B981" },
    { name: "Miscellaneous", color: "#6B7280" },
  ]

  await db.expenseCategory.createMany({
    data: defaults.map((d, i) => ({ weddingId, ...d, sortOrder: i })),
  })

  revalidatePath("/budget")
  return { success: true, seeded: true }
}

// ─── Split config ─────────────────────────────────────────────────────────────

export async function updateSplitConfig(weddingId: string, data: unknown) {
  const member = await getWeddingMember(weddingId)
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN"))
    return { error: "Unauthorized" }

  const parsed = splitConfigSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  await db.wedding.update({
    where: { id: weddingId },
    data: {
      splitEnabled: parsed.data.splitEnabled,
      splitAgreement: parsed.data.splitAgreement
        ? JSON.stringify(parsed.data.splitAgreement)
        : null,
    },
  })

  revalidatePath("/budget")
  return { success: true }
}

// ─── Per-event budget ─────────────────────────────────────────────────────────

export async function setEventBudget(eventId: string, weddingId: string, budget: string | null) {
  const member = await getWeddingMember(weddingId)
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN"))
    return { error: "Unauthorized" }

  await db.event.update({
    where: { id: eventId },
    data: { eventBudget: budget },
  })
  revalidatePath("/budget")
  return { success: true }
}

export async function setOverallBudget(weddingId: string, budget: string | null) {
  const member = await getWeddingMember(weddingId)
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN"))
    return { error: "Unauthorized" }

  await db.wedding.update({ where: { id: weddingId }, data: { totalBudget: budget } })
  revalidatePath("/budget")
  return { success: true }
}

// ─── Activity log ─────────────────────────────────────────────────────────────

export async function getActivityLog(weddingId: string, limit = 20) {
  const member = await getWeddingMember(weddingId)
  if (!member) return { error: "Unauthorized" }

  const activities = await db.expenseActivity.findMany({
    where: { weddingId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return { activities }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(expenseId: string, weddingId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const member = await getWeddingMember(weddingId)
  if (!member) return { error: "Unauthorized" }

  const parsed = commentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const comment = await db.expenseComment.create({
    data: { expenseId, userId: session.user.id, content: parsed.data.content },
    include: { user: { select: { id: true, name: true } } },
  })
  revalidatePath("/budget")
  return { success: true, comment }
}

export async function deleteComment(commentId: string, weddingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const comment = await db.expenseComment.findUnique({
    where: { id: commentId },
  })
  if (!comment) return { error: "Not found" }

  const member = await getWeddingMember(weddingId)
  if (!member) return { error: "Unauthorized" }
  // Can delete own comments or if owner/admin
  if (comment.userId !== session.user.id && member.role !== "OWNER" && member.role !== "ADMIN")
    return { error: "Unauthorized" }

  await db.expenseComment.delete({ where: { id: commentId } })
  revalidatePath("/budget")
  return { success: true }
}
