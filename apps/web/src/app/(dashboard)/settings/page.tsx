"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Settings, Users, Trash2, Plus, Crown, Shield, Pencil, Eye, Copy, Check, Link2 } from "lucide-react"
import { initials } from "@/lib/utils"

type Member = {
  id: string
  role: string
  user: { id: string; name: string | null; email: string | null; image: string | null }
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  OWNER: { label: "Owner", color: "bg-amber-100 text-amber-800", icon: Crown },
  ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-800", icon: Shield },
  EDITOR: { label: "Editor", color: "bg-green-100 text-green-800", icon: Pencil },
  VIEWER: { label: "Viewer", color: "bg-gray-100 text-gray-700", icon: Eye },
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [currentRole, setCurrentRole] = useState("")
  const [openInvite, setOpenInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState("EDITOR")
  const [inviteLink, setInviteLink] = useState("")
  const [inviteExpiry, setInviteExpiry] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)

  const [wedding, setWedding] = useState({
    id: "",
    partnerOneName: "",
    partnerTwoName: "",
    weddingDate: "",
    weddingTime: "",
    weddingLocation: "",
    city: "",
    state: "",
    country: "IN",
    totalBudget: "",
    currency: "INR",
  })

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setCurrentUserId(data.currentUserId ?? "")
        setCurrentRole(data.currentRole ?? "")
        setMembers(data.members ?? [])
        if (data.wedding) {
          const w = data.wedding
          setWedding({
            id: w.id ?? "",
            partnerOneName: w.partnerOneName ?? "",
            partnerTwoName: w.partnerTwoName ?? "",
            weddingDate: w.weddingDate ? new Date(w.weddingDate).toISOString().slice(0, 10) : "",
            weddingTime: w.weddingTime ?? "",
            weddingLocation: w.weddingLocation ?? "",
            city: w.city ?? "",
            state: w.state ?? "",
            country: w.country ?? "US",
            totalBudget: w.totalBudget ?? "",
            currency: w.currency ?? "INR",
          })
        }
      })
      .catch(() => {})
  }, [])

  async function handleSaveWedding() {
    setLoading(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId: wedding.id, ...wedding }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success("Wedding details updated!")
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateLink() {
    setLoading(true)
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setInviteLink(data.inviteUrl)
      setInviteExpiry(new Date(data.expiresAt))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRemove(memberId: string) {
    const res = await fetch(`/api/settings/members/${memberId}`, { method: "DELETE" })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setMembers(members.filter((m) => m.id !== memberId))
    toast.success("Member removed")
  }

  const canManage = ["OWNER", "ADMIN"].includes(currentRole)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your wedding details and collaborators</p>
      </div>

      {/* Wedding Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Wedding Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Partner 1 Name</Label>
            <Input
              value={wedding.partnerOneName}
              onChange={(e) => setWedding({ ...wedding, partnerOneName: e.target.value })}
              placeholder="Partner 1"
            />
          </div>
          <div className="space-y-2">
            <Label>Partner 2 Name</Label>
            <Input
              value={wedding.partnerTwoName}
              onChange={(e) => setWedding({ ...wedding, partnerTwoName: e.target.value })}
              placeholder="Partner 2"
            />
          </div>
          <div className="space-y-2">
            <Label>Wedding Date</Label>
            <Input
              type="date"
              value={wedding.weddingDate}
              onChange={(e) => setWedding({ ...wedding, weddingDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Wedding Time</Label>
            <Input
              type="time"
              value={wedding.weddingTime}
              onChange={(e) => setWedding({ ...wedding, weddingTime: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Venue / Location</Label>
            <Input
              value={wedding.weddingLocation}
              onChange={(e) => setWedding({ ...wedding, weddingLocation: e.target.value })}
              placeholder="The Grand Ballroom"
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={wedding.city}
              onChange={(e) => setWedding({ ...wedding, city: e.target.value })}
              placeholder="New York"
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              value={wedding.state}
              onChange={(e) => setWedding({ ...wedding, state: e.target.value })}
              placeholder="NY"
            />
          </div>
          <div className="space-y-2">
            <Label>Total Budget</Label>
            <Input
              type="number"
              value={wedding.totalBudget}
              onChange={(e) => setWedding({ ...wedding, totalBudget: e.target.value })}
              placeholder="30000"
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              value={wedding.currency}
              onChange={(e) => setWedding({ ...wedding, currency: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="AUD">AUD (A$) — Australian Dollar</option>
              <option value="CAD">CAD (CA$) — Canadian Dollar</option>
              <option value="SGD">SGD (S$) — Singapore Dollar</option>
              <option value="AED">AED (د.إ) — UAE Dirham</option>
              <option value="MYR">MYR (RM) — Malaysian Ringgit</option>
              <option value="CHF">CHF (Fr) — Swiss Franc</option>
              <option value="JPY">JPY (¥) — Japanese Yen</option>
              <option value="THB">THB (฿) — Thai Baht</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end">
            <Button onClick={handleSaveWedding} disabled={loading}>
              {loading ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Collaborators
            </CardTitle>
            {canManage && (
              <Button size="sm" onClick={() => setOpenInvite(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.VIEWER
            const RoleIcon = roleConfig.icon
            const isCurrentUser = member.user.id === currentUserId

            return (
              <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.user.image ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(member.user.name ?? member.user.email ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {member.user.name ?? member.user.email}
                    {isCurrentUser && <span className="text-muted-foreground ml-1.5 text-xs">(you)</span>}
                  </p>
                  {member.user.name && (
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  )}
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleConfig.label}
                </span>
                {canManage && !isCurrentUser && member.role !== "OWNER" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={openInvite} onOpenChange={(open) => { setOpenInvite(open); if (!open) { setInviteLink(""); setInviteExpiry(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Invite Collaborator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["ADMIN", "EDITOR", "VIEWER"] as const).map((role) => {
                  const config = ROLE_CONFIG[role]
                  const Icon = config.icon
                  return (
                    <button
                      key={role}
                      onClick={() => { setInviteRole(role); setInviteLink("") }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                        inviteRole === role
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {role === "ADMIN" ? "Full access" : role === "EDITOR" ? "Can edit" : "View only"}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {inviteLink ? (
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {inviteExpiry && (
                  <p className="text-xs text-muted-foreground">
                    Expires {inviteExpiry.toLocaleDateString()}. Anyone with this link can join.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate a shareable link. Anyone who clicks it can sign in or create an account and join as a{" "}
                <span className="font-medium">{ROLE_CONFIG[inviteRole]?.label}</span>.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInvite(false)}>Close</Button>
            {!inviteLink ? (
              <Button onClick={handleGenerateLink} disabled={loading}>
                <Link2 className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Link"}
              </Button>
            ) : (
              <Button onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
