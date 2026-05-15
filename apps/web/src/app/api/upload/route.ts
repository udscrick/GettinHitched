import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const albumId = formData.get("albumId") as string
    const caption = formData.get("caption") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    let weddingId = ""
    if (albumId) {
      const album = await db.album.findUnique({
        where: { id: albumId },
        include: { event: { select: { weddingId: true } } },
      })
      if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 })
      weddingId = album.event.weddingId
    }

    const member = await db.weddingMember.findFirst({
      where: { weddingId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const ext = file.name.split(".").pop()
    const filename = `uploads/${weddingId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

    const blob = await put(filename, file, { access: "public" })

    if (albumId) {
      const photo = await db.photo.create({
        data: {
          albumId,
          url: blob.url,
          filename: file.name,
          caption: caption ?? undefined,
          fileSize: file.size,
          mimeType: file.type,
        },
      })
      return NextResponse.json({ success: true, url: blob.url, photoId: photo.id })
    }

    return NextResponse.json({ success: true, url: blob.url })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
