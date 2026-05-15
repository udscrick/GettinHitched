"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Eye, EyeOff, ExternalLink, Palette } from "lucide-react"

const THEMES = [
  { id: "blush", label: "Blush Pink", color: "#E8B4B8" },
  { id: "champagne", label: "Champagne Gold", color: "#C9A96E" },
  { id: "sage", label: "Sage Green", color: "#8fad8f" },
  { id: "ivory", label: "Classic Ivory", color: "#FDF8F5" },
  { id: "midnight", label: "Midnight Blue", color: "#1a2744" },
]

type WebsiteSection = {
  id: string
  type: string
  title: string | null
  content: string | null
  isVisible: boolean
  sortOrder: number
  config: string | null
}

export default function WebsitePage() {
  const [loading, setLoading] = useState(false)
  const [weddingId, setWeddingId] = useState("")
  const [slug, setSlug] = useState("")
  const [sections, setSections] = useState<WebsiteSection[]>([])

  const [settings, setSettings] = useState({
    websiteEnabled: false,
    websiteTheme: "blush",
    websiteTitle: "",
    websiteMessage: "",
    story: "",
  })

  useEffect(() => {
    fetch("/api/website")
      .then((r) => r.json())
      .then((data) => {
        setWeddingId(data.weddingId ?? "")
        setSlug(data.slug ?? "")
        setSections(data.sections ?? [])
        if (data.settings) {
          setSettings({
            websiteEnabled: data.settings.websiteEnabled ?? false,
            websiteTheme: data.settings.websiteTheme ?? "blush",
            websiteTitle: data.settings.websiteTitle ?? "",
            websiteMessage: data.settings.websiteMessage ?? "",
            story: data.settings.story ?? "",
          })
        }
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, ...settings }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success("Website settings saved!")
    } finally {
      setLoading(false)
    }
  }

  async function toggleSection(section: WebsiteSection) {
    const res = await fetch(`/api/website/sections/${section.id}`, { method: "POST" })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setSections(sections.map((s) => s.id === section.id ? { ...s, isVisible: !s.isVisible } : s))
  }

  const publicUrl = slug ? `/w/${slug}` : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Wedding Website</h1>
          <p className="text-muted-foreground mt-1">Your public wedding page for guests</p>
        </div>
        <div className="flex gap-3">
          {publicUrl && settings.websiteEnabled && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Publish Toggle */}
      <Card className={settings.websiteEnabled ? "border-green-300 bg-green-50/50" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.websiteEnabled ? (
                <Globe className="h-6 w-6 text-green-500" />
              ) : (
                <EyeOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {settings.websiteEnabled ? "Website is Live" : "Website is Private"}
                </p>
                {publicUrl && (
                  <p className="text-sm text-muted-foreground">
                    {typeof window !== "undefined" ? window.location.origin : ""}{publicUrl}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={settings.websiteEnabled ? "destructive" : "default"}
              onClick={() => setSettings({ ...settings, websiteEnabled: !settings.websiteEnabled })}
            >
              {settings.websiteEnabled ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSettings({ ...settings, websiteTheme: theme.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  settings.websiteTheme === theme.id
                    ? "border-primary ring-2 ring-primary ring-offset-1"
                    : "border-border hover:border-primary"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: theme.color }}
                />
                {theme.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Website Content */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Website Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Website Title</Label>
            <Input
              value={settings.websiteTitle}
              onChange={(e) => setSettings({ ...settings, websiteTitle: e.target.value })}
              placeholder="Sarah & John's Wedding"
            />
          </div>
          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <Textarea
              value={settings.websiteMessage}
              onChange={(e) => setSettings({ ...settings, websiteMessage: e.target.value })}
              placeholder="We're so happy you're here..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Our Love Story</Label>
            <Textarea
              value={settings.story}
              onChange={(e) => setSettings({ ...settings, story: e.target.value })}
              placeholder="How did you meet? Tell your story..."
              rows={6}
              className="font-serif text-base leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections Visibility */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Page Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm capitalize">{section.type.replace(/_/g, " ")}</p>
                  {section.title && (
                    <p className="text-xs text-muted-foreground">{section.title}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleSection(section)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    section.isVisible
                      ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                      : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700"
                  }`}
                >
                  {section.isVisible ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Hidden
                    </>
                  )}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
