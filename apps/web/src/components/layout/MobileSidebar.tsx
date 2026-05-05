"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS } from "@/lib/constants/nav"
import { useWedding } from "@/contexts/WeddingContext"
import { Heart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { wedding } = useWedding()

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-card border-r shadow-xl overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-champagne">
                  <Heart className="h-3.5 w-3.5 text-champagne-gold" />
                </div>
                <span className="font-serif text-base font-semibold">GettinHitched</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {wedding && (
              <div className="px-6 py-3 border-b bg-champagne/20">
                <p className="text-xs text-muted-foreground">Planning</p>
                <p className="font-serif text-sm font-medium">
                  {wedding.partnerOneName} & {wedding.partnerTwoName}
                </p>
              </div>
            )}

            <nav className="py-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="mb-4">
                  <p className="px-6 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}
                  </p>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                          isActive
                            ? "bg-champagne/40 text-champagne-gold font-medium"
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
          </aside>
        </div>
      )}
    </>
  )
}
