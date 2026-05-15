import { z } from "zod"

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().min(1, "Amount is required").default("0"),
  eventId: z.string().min(1, "Event is required"),
  categoryId: z.string().optional(),
  currency: z.enum(["INR", "AED", "USD"]).default("INR"),
  paidBy: z.string().optional(),
  expenseDate: z.string().optional().nullable(),
  paymentStatus: z.enum(["PAID", "ADVANCE_GIVEN", "PENDING"]).default("PENDING"),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  description: z.string().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().default("#C9A96E"),
  icon: z.string().optional(),
})

export const splitConfigSchema = z.object({
  splitEnabled: z.boolean(),
  splitAgreement: z
    .array(
      z.object({
        partyName: z.string().min(1),
        percentage: z.number().min(0).max(100),
      })
    )
    .optional(),
})

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SplitConfigInput = z.infer<typeof splitConfigSchema>
export type CommentInput = z.infer<typeof commentSchema>
