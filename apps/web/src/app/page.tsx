import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, CheckCircle, Users, DollarSign, Calendar, Camera } from "lucide-react"

const FEATURES = [
  { icon: DollarSign, title: "Budget & Expenses", desc: "Track every dollar with categories, vendor links, and payment schedules." },
  { icon: Users, title: "Guest Management", desc: "Manage RSVPs, dietary needs, seating charts, and drag-and-drop table assignments." },
  { icon: Calendar, title: "Planning Timeline", desc: "60+ pre-built tasks from 12 months out to day-of, fully customizable." },
  { icon: Camera, title: "Photo Gallery", desc: "Upload inspiration boards, venue tours, and engagement photos." },
  { icon: Heart, title: "Ceremony & Reception", desc: "Build your program, playlist, vows, and day-of timeline." },
  { icon: CheckCircle, title: "Vendor Management", desc: "Track contracts, payments, and communications for every vendor." },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne">
            <Heart className="h-4 w-4 text-champagne-gold" />
          </div>
          <span className="font-serif text-xl font-semibold">GettinHitched</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button variant="gold" asChild>
            <Link href="/sign-up">Start Planning Free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blush/10 to-champagne/10" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-champagne px-4 py-1.5 text-sm font-medium text-champagne-gold mb-6">
            <Heart className="h-3.5 w-3.5" />
            The all-in-one wedding planning app
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Plan Your Perfect
            <br />
            <span className="text-champagne-gold">Wedding Day</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Everything you need to plan your dream wedding in one beautiful place. Budget, guests, vendors, venues, gallery, and so much more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="gold" asChild className="text-base px-8">
              <Link href="/sign-up">Start Planning Free →</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="font-serif text-4xl font-bold text-center mb-4">Everything in One Place</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          From the moment you get engaged to your honeymoon — we cover every detail so you can focus on what matters most.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-xl border bg-white p-6 card-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne mb-4">
                  <Icon className="h-5 w-5 text-champagne-gold" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center bg-gradient-to-r from-champagne/30 to-blush/20">
        <h2 className="font-serif text-4xl font-bold mb-4">Ready to Start Planning?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join couples who are planning their dream wedding with GettinHitched.
        </p>
        <Button size="lg" variant="gold" asChild className="text-base px-10">
          <Link href="/sign-up">Get Started Today →</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center text-sm text-muted-foreground">
        <p>Made with ❤️ for couples everywhere</p>
      </footer>
    </div>
  )
}
