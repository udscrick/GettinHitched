import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { GalleryClient } from "./GalleryClient"

export default async function GalleryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          albums: {
            include: {
              photos: { orderBy: { sortOrder: "asc" } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Photo Gallery</h1>
        <p className="text-muted-foreground mt-1">
          Store and organize your wedding photos
        </p>
      </div>
      <GalleryClient
        weddingId={wedding.id}
        albums={wedding.albums}
        role={role}
      />
    </div>
  )
}
