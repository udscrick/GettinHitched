import { NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password required" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password as string, 12)
    const user = await db.user.create({ data: { name, email, passwordHash } })

    const token = await encode({
      token: { sub: user.id, id: user.id, email: user.email, name: user.name },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    })

    return NextResponse.json({ token, userId: user.id })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
