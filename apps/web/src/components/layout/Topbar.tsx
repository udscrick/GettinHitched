"use client"

import { useWedding } from "@/contexts/WeddingContext"
import { daysUntil } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Heart, LogOut, Settings, Menu } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { initials } from "@/lib/utils"
import Link from "next/link"
import { MobileSidebar } from "./MobileSidebar"

export function Topbar() {
  const { wedding } = useWedding()
  const { data: session } = useSession()
  const days = wedding?.weddingDate ? daysUntil(wedding.weddingDate) : null

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4 lg:px-6">
      {/* Mobile menu */}
      <div className="flex items-center gap-3 lg:hidden">
        <MobileSidebar />
        <div className="flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-champagne-gold" />
          <span className="font-serif font-semibold">GettinHitched</span>
        </div>
      </div>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Countdown */}
        {days !== null && days >= 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-champagne px-3 py-1 text-sm">
            <Heart className="h-3 w-3 text-champagne-gold" />
            <span className="font-medium text-foreground">
              {days === 0 ? "Today! 🎉" : `${days} days to go`}
            </span>
          </div>
        )}
        {days !== null && days < 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-sm">
            <span className="font-medium">Married {Math.abs(days)}d ago 💍</span>
          </div>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback>
                  {initials(session?.user?.name ?? session?.user?.email ?? "U")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{session?.user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
