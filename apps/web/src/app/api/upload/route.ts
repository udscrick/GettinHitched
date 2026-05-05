import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Get wedding for this album
    let weddingId = ""
    if (albumId) {
      const album = await db.album.findUnique({ where: { id: albumId } })
      if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 })
      weddingId = album.weddingId
    }

    // Verify access
    const member = await db.weddingMember.findFirst({
      where: { weddingId, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop()
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const uploadDir = join(process.cwd(), "public", "uploads", weddingId)

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/uploads/${weddingId}/${filename}`

    // Create photo record in DB
    if (albumId) {
      const photo = await db.photo.create({
        data: {
          albumId,
          url,
          filename: file.name,
          caption: caption ?? undefined,
          fileSize: file.size,
          mimeType: file.type,
        },
      })
      return NextResponse.json({ success: true, url, photoId: photo.id })
    }

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
