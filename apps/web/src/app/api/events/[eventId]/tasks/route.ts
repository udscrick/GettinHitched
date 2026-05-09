import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function getAccess(eventId: string, userId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) return null
  const member = await db.weddingMember.findFirst({
    where: { weddingId: event.weddingId, userId },
  })
  return member ? { event, member } : null
}

export async function GET(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const tasks = await db.task.findMany({
      where: { eventId: params.eventId },
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
    })

    return NextResponse.json({ tasks })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access || access.member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const task = await db.task.create({
      data: {
        eventId: params.eventId,
        title: body.title,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority ?? "MEDIUM",
        category: body.category,
        notes: body.notes,
      },
    })

    return NextResponse.json({ task })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "Task id required" }, { status: 400 })

    const task = await db.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isCompleted !== undefined && {
          isCompleted: data.isCompleted,
          completedAt: data.isCompleted ? new Date() : null,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })

    return NextResponse.json({ task })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access || access.member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Task id required" }, { status: 400 })

    await db.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
