import { z } from "zod"

export const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().default("RESEARCHING"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  price: z.string().optional(),
  depositAmount: z.string().optional(),
  depositPaid: z.boolean().default(false),
  rating: z.number().min(1).max(5).optional().nullable(),
  review: z.string().optional(),
  notes: z.string().optional(),
  instagramHandle: z.string().optional(),
})

export const vendorCommSchema = z.object({
  type: z.enum(["EMAIL", "PHONE", "IN_PERSON", "VIDEO_CALL", "TEXT"]).default("EMAIL"),
  date: z.string(),
  summary: z.string().min(1, "Summary is required"),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
})

export type VendorInput = z.infer<typeof vendorSchema>
export type VendorCommInput = z.infer<typeof vendorCommSchema>
