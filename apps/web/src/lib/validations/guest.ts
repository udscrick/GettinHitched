import { z } from "zod"

export const guestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  side: z.enum(["PARTNER_ONE", "PARTNER_TWO", "BOTH"]).default("BOTH"),
  groupId: z.string().optional(),
  rsvpStatus: z.enum(["PENDING", "ATTENDING", "DECLINED", "MAYBE"]).default("PENDING"),
  dietaryRestriction: z.string().optional(),
  dietaryNotes: z.string().optional(),
  mealChoice: z.string().optional(),
  isChild: z.boolean().default(false),
  notes: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
})

export const guestGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
})

export type GuestInput = z.infer<typeof guestSchema>
export type GuestGroupInput = z.infer<typeof guestGroupSchema>
