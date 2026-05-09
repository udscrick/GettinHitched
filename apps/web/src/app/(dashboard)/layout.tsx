import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { WeddingProvider } from "@/contexts/WeddingContext"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: true,
    },
    orderBy: { joinedAt: "asc" },
  })

  if (!weddingMember) redirect("/onboarding")

  const { wedding, role } = weddingMember

  return (
    <WeddingProvider
      value={{
        wedding: {
          id: wedding.id,
          slug: wedding.slug,
          partnerOneName: wedding.partnerOneName,
          partnerTwoName: wedding.partnerTwoName,
          weddingDate: wedding.weddingDate,
          city: wedding.city,
          state: wedding.state,
          coverPhotoUrl: wedding.coverPhotoUrl,
          websiteEnabled: wedding.websiteEnabled,
          websiteTheme: wedding.websiteTheme,
          story: wedding.story,
        },
        memberRole: role,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="container mx-auto max-w-7xl p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WeddingProvider>
  )
}
