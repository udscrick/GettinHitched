import { Heart } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-champagne/40 via-blush/20 to-champagne/30 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-champagne-gold text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: 0.3 + Math.random() * 0.7,
              }}
            >
              ❤️
            </div>
          ))}
        </div>
        <div className="relative text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-champagne shadow-lg">
              <Heart className="h-8 w-8 text-champagne-gold" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
            GettinHitched
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your complete wedding planning companion. Every detail, beautifully organized.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {["Budget Tracking", "Guest Management", "Vendor Contacts", "Seating Charts", "Photo Gallery", "Wedding Website"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-muted-foreground">
                <span className="text-champagne-gold">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne">
              <Heart className="h-4 w-4 text-champagne-gold" />
            </div>
            <span className="font-serif text-xl font-semibold">GettinHitched</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
