"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Camera, Plus, Upload, X, ChevronLeft, Images, Folder } from "lucide-react"

const ALBUM_CATEGORIES = [
  "GENERAL", "ENGAGEMENT", "WEDDING_DAY", "CEREMONY", "RECEPTION",
  "REHEARSAL", "HONEYMOON", "GETTING_READY", "FAMILY", "VENDOR_INSPIRATION",
]

interface Photo {
  id: string
  url: string
  caption: string | null
  filename: string
}

interface Album {
  id: string
  name: string
  category: string
  coverPhotoUrl: string | null
  photos: Photo[]
}

interface Props {
  weddingId: string
  albums: Album[]
  role: string
}

export function GalleryClient({ weddingId, albums, role }: Props) {
  const router = useRouter()
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)
  const [albumForm, setAlbumForm] = useState({ name: "", category: "GENERAL" })
  const [uploadForm, setUploadForm] = useState({ caption: "", albumId: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const canEdit = role !== "VIEWER"

  async function handleCreateAlbum() {
    if (!albumForm.name) { toast.error("Album name is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, name: albumForm.name, category: albumForm.category }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success("Album created!")
      setAlbumDialogOpen(false)
      setAlbumForm({ name: "", category: "GENERAL" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile) { toast.error("Please select a file"); return }
    if (!uploadForm.albumId) { toast.error("Please select an album"); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("albumId", uploadForm.albumId)
      if (uploadForm.caption) formData.append("caption", uploadForm.caption)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success("Photo uploaded!")
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setUploadForm({ caption: "", albumId: "" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Update selectedAlbum from current albums when data refreshes
  const currentAlbum = selectedAlbum
    ? albums.find((a) => a.id === selectedAlbum.id) ?? null
    : null

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {!currentAlbum && (
        <div className="flex gap-3 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadForm({ caption: "", albumId: albums[0]?.id ?? "" })
                  setUploadDialogOpen(true)
                }}
                disabled={albums.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <Button onClick={() => setAlbumDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Album
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Album view */}
      {currentAlbum ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Albums
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl font-semibold">{currentAlbum.name}</h2>
              <Badge variant="outline" className="text-xs">
                {currentAlbum.photos.length} photos
              </Badge>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setUploadForm({ caption: "", albumId: currentAlbum.id })
                  setUploadDialogOpen(true)
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>

          {currentAlbum.photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No photos in this album yet</p>
                {canEdit && (
                  <Button
                    onClick={() => {
                      setUploadForm({ caption: "", albumId: currentAlbum.id })
                      setUploadDialogOpen(true)
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Photo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {currentAlbum.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer break-inside-avoid rounded-lg overflow-hidden"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? photo.filename}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Album grid */
        <>
          {albums.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="text-6xl">📸</div>
                <div className="text-center">
                  <p className="font-medium text-lg">No albums yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Create albums to organize your photos
                  </p>
                </div>
                {canEdit && (
                  <Button onClick={() => setAlbumDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Album
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <Card
                  key={album.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => setSelectedAlbum(album)}
                >
                  <div className="aspect-square bg-muted rounded-t-lg overflow-hidden relative">
                    {album.coverPhotoUrl || album.photos[0] ? (
                      <Image
                        src={album.coverPhotoUrl ?? album.photos[0].url}
                        alt={album.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Folder className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{album.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs">
                        {album.category.replace("_", " ")}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Images className="h-3 w-3" />
                        {album.photos.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Album Dialog */}
      <Dialog open={albumDialogOpen} onOpenChange={setAlbumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Create Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Album Name *</Label>
              <Input
                value={albumForm.name}
                onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                placeholder="Engagement Photos"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={albumForm.category}
                onValueChange={(v) => setAlbumForm({ ...albumForm, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALBUM_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlbumDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAlbum} disabled={loading}>
              {loading ? "Creating..." : "Create Album"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Upload Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Album</Label>
              <Select
                value={uploadForm.albumId}
                onValueChange={(v) => setUploadForm({ ...uploadForm, albumId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select album..." /></SelectTrigger>
                <SelectContent>
                  {albums.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Photo *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                value={uploadForm.caption}
                onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                placeholder="Add a caption..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption ?? lightboxPhoto.filename}
              width={1200}
              height={800}
              className="object-contain max-h-[80vh] w-full rounded-lg"
            />
            {lightboxPhoto.caption && (
              <p className="text-white text-center mt-3 text-sm">{lightboxPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
