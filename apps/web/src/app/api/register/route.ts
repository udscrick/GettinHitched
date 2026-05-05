import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signUpSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signUpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, password } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: { name, email, passwordHash },
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
