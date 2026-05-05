import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAuthRoute = nextUrl.pathname.startsWith("/sign-in") ||
    nextUrl.pathname.startsWith("/sign-up")
  const isPublicRoute = nextUrl.pathname.startsWith("/w/") ||
    nextUrl.pathname.startsWith("/api/public")
  const isOnboarding = nextUrl.pathname.startsWith("/onboarding")

  if (isPublicRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", nextUrl))
    return NextResponse.next()
  }

  if (!isLoggedIn && !isOnboarding) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
