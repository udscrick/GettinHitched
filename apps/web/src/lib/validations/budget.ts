import { z } from "zod"

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  vendorName: z.string().optional(),
  amount: z.string().default("0"),
  expenseDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["PENDING", "ADVANCE_GIVEN", "PAID"]).default("PENDING"),
  paidBy: z.string().optional(),
  notes: z.string().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().default("#f9a8c9"),
  icon: z.string().optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type CategoryInput = z.infer<typeof categorySchema>
