"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS } from "@/lib/constants/nav"
import { useWedding } from "@/contexts/WeddingContext"
import { Heart } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { wedding } = useWedding()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne">
          <Heart className="h-4 w-4 text-champagne-gold" />
        </div>
        <div>
          <span className="font-serif text-lg font-semibold text-foreground">
            GettinHitched
          </span>
        </div>
      </div>

      {/* Wedding name */}
      {wedding && (
        <div className="px-6 py-3 border-b bg-champagne/20">
          <p className="text-xs text-muted-foreground">Planning</p>
          <p className="font-serif text-sm font-medium truncate">
            {wedding.partnerOneName} & {wedding.partnerTwoName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-6 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-champagne/40 text-champagne-gold font-medium border-r-2 border-champagne-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom decoration */}
      <div className="px-6 py-4 border-t">
        <p className="text-[11px] text-muted-foreground text-center font-serif italic">
          💍 Your perfect day awaits
        </p>
      </div>
    </aside>
  )
}
