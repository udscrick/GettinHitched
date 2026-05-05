import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { TasksClient } from "./TasksClient"

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const weddingMember = await db.weddingMember.findFirst({
    where: { userId: session.user.id },
    include: {
      wedding: {
        include: {
          tasks: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { dueDate: "asc" }] },
        },
      },
    },
  })

  if (!weddingMember) redirect("/onboarding")
  const { wedding, role } = weddingMember

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold">Tasks & Checklist</h1>
        <p className="text-muted-foreground mt-1">Stay on top of everything for your wedding</p>
      </div>
      <TasksClient
        weddingId={wedding.id}
        tasks={wedding.tasks}
        role={role}
      />
    </div>
  )
}
