"use client"

import { useState } from "react"

interface Props {
  slug: string
  themeAccent: string
  themeBorder: string
}

export function PublicRSVPForm({ slug, themeAccent, themeBorder }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    attending: "",
    dietary: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.attending) {
      setError("Please fill in your name and RSVP response")
      return
    }
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`/api/public/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl p-10 text-center space-y-4 border"
        style={{ borderColor: themeBorder, backgroundColor: `${themeAccent}15` }}
      >
        <div className="text-5xl">💌</div>
        <h3 className="text-2xl font-serif" style={{ color: themeAccent }}>
          {form.attending === "yes" ? "We can't wait to see you!" : "We'll miss you!"}
        </h3>
        <p className="font-sans opacity-80 text-sm">
          {form.attending === "yes"
            ? "Your RSVP has been received. We're so excited to celebrate with you!"
            : "Thank you for letting us know. We'll be thinking of you on our special day."}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-8 border space-y-5"
      style={{ borderColor: themeBorder }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium">First Name *</label>
          <input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Jane"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm font-sans bg-transparent focus:outline-none focus:ring-2"
            style={{ borderColor: themeBorder }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium">Last Name *</label>
          <input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Smith"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm font-sans bg-transparent focus:outline-none"
            style={{ borderColor: themeBorder }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium">Email Address</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jane@example.com"
          className="w-full rounded-lg border px-3 py-2 text-sm font-sans bg-transparent focus:outline-none"
          style={{ borderColor: themeBorder }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-sans font-medium">Will you be attending? *</label>
        <div className="flex gap-3">
          {[
            { value: "yes", label: "Joyfully Accepts" },
            { value: "no", label: "Regretfully Declines" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, attending: opt.value })}
              className="flex-1 py-3 px-4 rounded-lg border text-sm font-sans font-medium transition-all"
              style={{
                borderColor: form.attending === opt.value ? themeAccent : themeBorder,
                backgroundColor: form.attending === opt.value ? `${themeAccent}20` : "transparent",
                color: form.attending === opt.value ? themeAccent : undefined,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium">Dietary Restrictions</label>
        <input
          value={form.dietary}
          onChange={(e) => setForm({ ...form, dietary: e.target.value })}
          placeholder="Vegetarian, nut allergy, etc."
          className="w-full rounded-lg border px-3 py-2 text-sm font-sans bg-transparent focus:outline-none"
          style={{ borderColor: themeBorder }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium">Message to the couple</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Send your well wishes..."
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm font-sans bg-transparent focus:outline-none resize-none"
          style={{ borderColor: themeBorder }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-sans">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-sans font-medium text-sm transition-opacity disabled:opacity-60"
        style={{ backgroundColor: themeAccent, color: "white" }}
      >
        {loading ? "Sending..." : "Send RSVP"}
      </button>
    </form>
  )
}
