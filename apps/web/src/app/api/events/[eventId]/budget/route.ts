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

    const [categories, expenses] = await Promise.all([
      db.expenseCategory.findMany({
        where: { weddingId: access.event.weddingId },
        orderBy: { sortOrder: "asc" },
      }),
      db.expense.findMany({
        where: { eventId: params.eventId },
        include: { category: true, vendor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ categories, expenses })
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

    if (body.type === "category") {
      const category = await db.expenseCategory.create({
        data: {
          weddingId: access.event.weddingId,
          name: body.name,
          color: body.color ?? "#f9a8c9",
          icon: body.icon,
        },
      })
      return NextResponse.json({ category })
    }

    const expense = await db.expense.create({
      data: {
        eventId: params.eventId,
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        vendorId: body.vendorId,
        amount: body.amount ?? "0",
        paymentStatus: body.paymentStatus ?? "PENDING",
        paidBy: body.paidBy ?? null,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : null,
        notes: body.notes,
      },
      include: { category: true },
    })

    return NextResponse.json({ expense })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { eventId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await getAccess(params.eventId, session.user.id)
    if (!access || access.member.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, type, ...data } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (type === "category") {
      const category = await db.expenseCategory.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
        },
      })
      return NextResponse.json({ category })
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...(data.paidBy !== undefined && { paidBy: data.paidBy }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.expenseDate !== undefined && {
          expenseDate: data.expenseDate ? new Date(data.expenseDate) : null,
        }),
      },
    })

    return NextResponse.json({ expense })
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
    const type = searchParams.get("type")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (type === "category") {
      await db.expenseCategory.delete({ where: { id } })
    } else {
      await db.expense.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
