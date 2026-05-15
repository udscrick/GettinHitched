"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS } from "@/lib/constants/nav"
import { useWedding } from "@/contexts/WeddingContext"
import { Heart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { wedding } = useWedding()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const overlay = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[200] lg:hidden">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className="fixed left-0 top-0 h-full w-[min(18rem,85vw)] bg-card border-r shadow-2xl overflow-y-auto">
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-champagne/40 text-champagne-gold font-medium border-l-2 border-champagne-gold"
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

        <div className="px-6 py-4 border-t">
          <p className="text-[11px] text-muted-foreground text-center font-serif italic">
            💍 Your perfect day awaits
          </p>
        </div>
      </aside>
    </div>,
    document.body
  ) : null

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      {overlay}
    </>
  )
}
