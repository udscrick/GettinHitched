import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { TasksClient } from "@/app/(dashboard)/tasks/TasksClient"

export default async function EventTasksPage({ params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      tasks: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { dueDate: "asc" }] },
    },
  })
  if (!event) notFound()

  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId: session.user.id },
  })
  if (!member) redirect("/events")

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold">Tasks — {event.name}</h1>
        <p className="text-muted-foreground mt-1">Track what needs to be done for this event</p>
      </div>
      <TasksClient
        eventId={params.eventId}
        tasks={event.tasks}
        role={member.role}
      />
    </div>
  )
}
