"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { createWedding } from "@/actions/wedding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

const STEPS = ["Welcome", "Your Names", "Wedding Details", "Complete"]

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    partnerOneName: "",
    partnerTwoName: "",
    weddingDate: "",
    city: "",
    state: "",
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function finish() {
    setLoading(true)
    try {
      const result = await createWedding({
        partnerOneName: form.partnerOneName || session?.user?.name || "Partner 1",
        partnerTwoName: form.partnerTwoName || "Partner 2",
        weddingDate: form.weddingDate || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Your wedding planning journey begins! 💍")
      router.push("/dashboard")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-champagne shadow-md">
            <Heart className="h-8 w-8 text-champagne-gold" />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i <= step
                    ? "bg-champagne-gold text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 transition-colors ${
                    i < step ? "bg-champagne-gold" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white shadow-sm p-8">
          {step === 0 && (
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-champagne-gold mx-auto mb-4" />
              <h1 className="font-serif text-3xl font-bold mb-3">
                Congratulations! 🎉
              </h1>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Welcome to GettinHitched — your complete wedding planning companion. Let&apos;s set up your planning hub in just a few steps.
              </p>
              <Button variant="gold" className="w-full" onClick={() => setStep(1)}>
                Let&apos;s Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-serif text-2xl font-bold mb-2">Your Names</h2>
              <p className="text-muted-foreground mb-6">Who&apos;s getting married?</p>
              <div className="space-y-4">
                <div>
                  <Label>Partner 1 Name</Label>
                  <Input
                    placeholder="e.g. Emma"
                    value={form.partnerOneName}
                    onChange={(e) => update("partnerOneName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Partner 2 Name</Label>
                  <Input
                    placeholder="e.g. James"
                    value={form.partnerTwoName}
                    onChange={(e) => update("partnerTwoName", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={() => setStep(2)}
                  disabled={!form.partnerOneName || !form.partnerTwoName}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-serif text-2xl font-bold mb-2">Wedding Details</h2>
              <p className="text-muted-foreground mb-6">These can be updated anytime</p>
              <div className="space-y-4">
                <div>
                  <Label>Wedding Date (optional)</Label>
                  <Input
                    type="date"
                    value={form.weddingDate}
                    onChange={(e) => update("weddingDate", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City (optional)</Label>
                    <Input
                      placeholder="e.g. Nashville"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State (optional)</Label>
                    <Input
                      placeholder="e.g. TN"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button variant="gold" className="flex-1" onClick={() => setStep(3)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-champagne-gold mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold mb-2">All Set!</h2>
              <p className="text-muted-foreground mb-6">You&apos;re ready to start planning your perfect wedding.</p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button variant="gold" className="flex-1" onClick={finish} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="mr-2 h-4 w-4" />
                  )}
                  Start Planning!
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
