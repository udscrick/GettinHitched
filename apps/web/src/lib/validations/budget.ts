import { z } from "zod"

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  totalAmount: z.string().default("0"),
  paidAmount: z.string().default("0"),
  dueDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID", "OVERDUE", "REFUNDED"]).default("UNPAID"),
  isDeposit: z.boolean().default(false),
  notes: z.string().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  budgetAmount: z.string().default("0"),
  color: z.string().default("#f9a8c9"),
  icon: z.string().optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type CategoryInput = z.infer<typeof categorySchema>
