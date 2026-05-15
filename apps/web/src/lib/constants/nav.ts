import {
  LayoutDashboard,
  Calendar,
  Gift,
  Plane,
  Sparkles,
  FileText,
  Globe,
  MessageSquare,
  BarChart3,
  Settings,
  Mail,
  BookHeart,
} from "lucide-react"

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Events", href: "/events", icon: Calendar },
    ],
  },
  {
    label: "Celebrations",
    items: [
      { label: "Engagement", href: "/engagement", icon: BookHeart },
      { label: "Honeymoon", href: "/honeymoon", icon: Plane },
      { label: "Wedding Party", href: "/wedding-party", icon: Sparkles },
    ],
  },
  {
    label: "Creative",
    items: [
      { label: "Invitations", href: "/invitations", icon: Mail },
      { label: "Gift Registry", href: "/registry", icon: Gift },
      { label: "Wedding Website", href: "/website", icon: Globe },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Notes", href: "/notes", icon: MessageSquare },
      { label: "Legal & Documents", href: "/legal", icon: FileText },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]
