import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Heart } from "lucide-react"

export default async function InvitePage({
  params,
}: {
  params: { token: string }
}) {
  const { token } = params

  const invite = await db.weddingInvite.findUnique({
    where: { token },
    include: { wedding: true },
  })

  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
        <div className="text-center max-w-md">
          <Heart className="h-12 w-12 text-champagne-gold mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Invite Not Found</h1>
          <p className="text-muted-foreground">
            This invite link is invalid or has expired. Ask the wedding planner to send a new one.
          </p>
        </div>
      </div>
    )
  }

  const session = await auth()

  if (session?.user?.id) {
    // Already a member? Just go to dashboard.
    const existing = await db.weddingMember.findFirst({
      where: { weddingId: invite.weddingId, userId: session.user.id },
    })

    if (!existing) {
      await db.weddingMember.create({
        data: {
          weddingId: invite.weddingId,
          userId: session.user.id,
          role: invite.role,
          joinedAt: new Date(),
        },
      })
    }

    redirect("/dashboard")
  }

  const { wedding } = invite
  const coupleNames = `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
  const callbackUrl = `/invite/${token}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 text-champagne-gold mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-navy mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-lg text-muted-foreground">
            Help plan{" "}
            <span className="font-semibold text-foreground">{coupleNames}&apos;s</span>{" "}
            wedding
          </p>
          {wedding.weddingDate && (
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(wedding.weddingDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {wedding.city ? ` · ${wedding.city}` : ""}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Sign in or create an account to join the planning.
          </p>

          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="block w-full text-center py-2.5 px-4 rounded-lg bg-champagne-gold text-white font-medium hover:bg-champagne-gold/90 transition-colors"
          >
            Sign In
          </Link>

          <Link
            href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="block w-full text-center py-2.5 px-4 rounded-lg border border-border font-medium hover:bg-muted/40 transition-colors"
          >
            Create Account
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Joining as <span className="capitalize font-medium">{invite.role.toLowerCase()}</span>
        </p>
      </div>
    </div>
  )
}
