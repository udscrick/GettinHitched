import {
  LayoutDashboard,
  DollarSign,
  Users,
  ShoppingBag,
  Building2,
  CheckSquare,
  Image,
  Gift,
  Heart,
  Music2,
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
    ],
  },
  {
    label: "Planning",
    items: [
      { label: "Timeline & Checklist", href: "/tasks", icon: CheckSquare },
      { label: "Budget & Expenses", href: "/budget", icon: DollarSign },
      { label: "Guests & RSVPs", href: "/guests", icon: Users },
      { label: "Seating Chart", href: "/guests/seating", icon: Users },
    ],
  },
  {
    label: "Vendors & Venues",
    items: [
      { label: "Vendors", href: "/vendors", icon: ShoppingBag },
      { label: "Venues", href: "/venues", icon: Building2 },
    ],
  },
  {
    label: "The Wedding",
    items: [
      { label: "Ceremony", href: "/ceremony", icon: Heart },
      { label: "Reception", href: "/reception", icon: Music2 },
      { label: "Wedding Party", href: "/wedding-party", icon: Sparkles },
    ],
  },
  {
    label: "Celebrations",
    items: [
      { label: "Engagement", href: "/engagement", icon: BookHeart },
      { label: "Honeymoon", href: "/honeymoon", icon: Plane },
    ],
  },
  {
    label: "Creative",
    items: [
      { label: "Gallery & Inspiration", href: "/gallery", icon: Image },
      { label: "Invitations", href: "/invitations", icon: Mail },
      { label: "Gift Registry", href: "/registry", icon: Gift },
    ],
  },
  {
    label: "Digital",
    items: [
      { label: "Wedding Website", href: "/website", icon: Globe },
      { label: "Notes & Communications", href: "/notes", icon: MessageSquare },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Legal & Documents", href: "/legal", icon: FileText },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]
