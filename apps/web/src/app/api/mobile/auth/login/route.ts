import { NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password as string, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await encode({
      token: { sub: user.id, id: user.id, email: user.email, name: user.name },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    })

    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
