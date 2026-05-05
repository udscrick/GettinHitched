"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, CalendarDays, Users, Share2 } from "lucide-react"

const TABS = [
  { id: "proposal", label: "The Proposal", icon: Heart },
  { id: "party", label: "Engagement Party", icon: Users },
  { id: "announcements", label: "Announcements", icon: Share2 },
]

const DEFAULT_ANNOUNCEMENTS = [
  "Parents",
  "Siblings",
  "Close Friends",
  "Extended Family",
  "Social Media",
  "Newspaper",
]

type AnnouncementItem = { id: string; name: string; done: boolean; date: string }

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState("proposal")
  const [loading, setLoading] = useState(false)
  const [weddingId, setWeddingId] = useState("")

  const [proposal, setProposal] = useState({
    proposalDate: "",
    proposalLocation: "",
    whoProposed: "",
    ringDescription: "",
    proposalStory: "",
    notes: "",
  })

  const [party, setParty] = useState({
    engagementPartyDate: "",
    engagementPartyVenue: "",
    engagementPartyNotes: "",
  })

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
    DEFAULT_ANNOUNCEMENTS.map((name, i) => ({
      id: `a-${i}`,
      name,
      done: false,
      date: "",
    }))
  )

  useEffect(() => {
    fetch("/api/engagement")
      .then((r) => r.json())
      .then((data) => {
        setWeddingId(data.weddingId ?? "")
        if (data.engagement) {
          const e = data.engagement
          setProposal({
            proposalDate: e.proposalDate ? new Date(e.proposalDate).toISOString().slice(0, 10) : "",
            proposalLocation: e.proposalLocation ?? "",
            whoProposed: e.whoProposed ?? "",
            ringDescription: e.ringDescription ?? "",
            proposalStory: e.proposalStory ?? "",
            notes: e.notes ?? "",
          })
          setParty({
            engagementPartyDate: e.engagementPartyDate ? new Date(e.engagementPartyDate).toISOString().slice(0, 10) : "",
            engagementPartyVenue: e.engagementPartyVenue ?? "",
            engagementPartyNotes: e.engagementPartyNotes ?? "",
          })
          if (e.announcementItems) {
            try { setAnnouncements(JSON.parse(e.announcementItems)) } catch {}
          }
        }
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch("/api/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          ...proposal,
          ...party,
          announcementItems: JSON.stringify(announcements),
        }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success("Engagement details saved!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Engagement</h1>
          <p className="text-muted-foreground mt-1">Celebrate and document your love story</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save All"}
        </Button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "proposal" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proposal Date</Label>
                <Input
                  type="date"
                  value={proposal.proposalDate}
                  onChange={(e) => setProposal({ ...proposal, proposalDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Who Proposed</Label>
                <Input
                  value={proposal.whoProposed}
                  onChange={(e) => setProposal({ ...proposal, whoProposed: e.target.value })}
                  placeholder="Partner 1 / Partner 2 / Both"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Proposal Location</Label>
                <Input
                  value={proposal.proposalLocation}
                  onChange={(e) => setProposal({ ...proposal, proposalLocation: e.target.value })}
                  placeholder="Paris, France / The beach at sunset..."
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Ring Description</Label>
                <Input
                  value={proposal.ringDescription}
                  onChange={(e) => setProposal({ ...proposal, ringDescription: e.target.value })}
                  placeholder="Round cut diamond, platinum band..."
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>The Proposal Story</Label>
                <Textarea
                  value={proposal.proposalStory}
                  onChange={(e) => setProposal({ ...proposal, proposalStory: e.target.value })}
                  placeholder="Tell the story of how they proposed..."
                  rows={8}
                  className="font-serif text-base leading-relaxed"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={proposal.notes}
                  onChange={(e) => setProposal({ ...proposal, notes: e.target.value })}
                  placeholder="Any other memories or details to capture..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "party" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Engagement Party</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Party Date</Label>
              <Input
                type="date"
                value={party.engagementPartyDate}
                onChange={(e) => setParty({ ...party, engagementPartyDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={party.engagementPartyVenue}
                onChange={(e) => setParty({ ...party, engagementPartyVenue: e.target.value })}
                placeholder="The Grand Ballroom / Home"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Party Notes</Label>
              <Textarea
                value={party.engagementPartyNotes}
                onChange={(e) => setParty({ ...party, engagementPartyNotes: e.target.value })}
                placeholder="Guest list, catering, decorations..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "announcements" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl">Announcement Checklist</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAnnouncements([
                    ...announcements,
                    { id: `a-${Date.now()}`, name: "", done: false, date: "" },
                  ])
                }
              >
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setAnnouncements(
                      announcements.map((a) =>
                        a.id === item.id ? { ...a, done: !a.done } : a
                      )
                    )
                  }
                  className="h-4 w-4 accent-primary"
                />
                <Input
                  value={item.name}
                  onChange={(e) =>
                    setAnnouncements(
                      announcements.map((a) =>
                        a.id === item.id ? { ...a, name: e.target.value } : a
                      )
                    )
                  }
                  className={`flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}
                  placeholder="Who to tell..."
                />
                <Input
                  type="date"
                  value={item.date}
                  onChange={(e) =>
                    setAnnouncements(
                      announcements.map((a) =>
                        a.id === item.id ? { ...a, date: e.target.value } : a
                      )
                    )
                  }
                  className="w-36"
                />
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
