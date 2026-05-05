import { z } from "zod"

export const createWeddingSchema = z.object({
  partnerOneName: z.string().min(2, "Name is required"),
  partnerTwoName: z.string().min(2, "Name is required"),
  weddingDate: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  totalBudget: z.string().optional(),
})

export const updateWeddingSchema = z.object({
  partnerOneName: z.string().min(2).optional(),
  partnerTwoName: z.string().min(2).optional(),
  weddingDate: z.string().nullable().optional(),
  weddingTime: z.string().nullable().optional(),
  weddingLocation: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().optional(),
  totalBudget: z.string().optional(),
  story: z.string().nullable().optional(),
  engagementDate: z.string().nullable().optional(),
})

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>
