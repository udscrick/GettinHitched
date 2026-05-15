"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signUpSchema } from "@/lib/validations/auth"
import { signIn } from "@/lib/auth"

export async function registerUser(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.user.create({
    data: { name, email, passwordHash },
  })

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  })

  return { success: true }
}
