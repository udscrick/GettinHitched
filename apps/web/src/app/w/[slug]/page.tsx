import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { PublicRSVPForm } from "./PublicRSVPForm"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { slug: string }
}

export default async function PublicWeddingPage({ params }: PageProps) {
  const wedding = await db.wedding.findUnique({
    where: { slug: params.slug },
    include: {
      websiteSections: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
    },
  })

  if (!wedding || !wedding.websiteEnabled) {
    notFound()
  }

  const theme = wedding.websiteTheme || "blush"
  const themeConfig: Record<string, { bg: string; accent: string; text: string; border: string; gradient: string }> = {
    blush: {
      bg: "#FDF8F6",
      accent: "#E8B4B8",
      text: "#6B3A3D",
      border: "#F0D0D2",
      gradient: "from-rose-50 via-pink-50 to-rose-100",
    },
    champagne: {
      bg: "#FEFCF7",
      accent: "#C9A96E",
      text: "#6B5A3E",
      border: "#E8D5B7",
      gradient: "from-amber-50 via-yellow-50 to-amber-100",
    },
    sage: {
      bg: "#F5F8F5",
      accent: "#7E9E7E",
      text: "#3B5A3B",
      border: "#C5D9C5",
      gradient: "from-green-50 via-emerald-50 to-green-100",
    },
    ivory: {
      bg: "#FEFEF8",
      accent: "#B8A87A",
      text: "#5A5240",
      border: "#DDD8C4",
      gradient: "from-yellow-50 via-cream-50 to-amber-50",
    },
    midnight: {
      bg: "#0F1629",
      accent: "#C9A96E",
      text: "#E8DCC8",
      border: "#1E2D4A",
      gradient: "from-slate-900 via-blue-950 to-slate-900",
    },
  }

  const t = themeConfig[theme] || themeConfig.blush

  const sectionMap: Record<string, typeof wedding.websiteSections[number]> = {}
  for (const section of wedding.websiteSections) {
    sectionMap[section.type] = section
  }

  const weddingDate = wedding.weddingDate
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(wedding.weddingDate))
    : null

  return (
    <div
      className="min-h-screen font-serif"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {/* Hero Section */}
      <section
        className={`min-h-screen flex flex-col items-center justify-center text-center p-8 relative overflow-hidden bg-gradient-to-br ${t.gradient}`}
      >
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div
            className="text-xs font-sans uppercase tracking-[0.3em] mb-4"
            style={{ color: t.accent }}
          >
            You are cordially invited
          </div>
          <h1 className="text-6xl sm:text-8xl font-serif font-bold leading-none">
            <span>{wedding.partnerOneName}</span>
            <span className="block text-3xl sm:text-4xl my-3" style={{ color: t.accent }}>
              &
            </span>
            <span>{wedding.partnerTwoName}</span>
          </h1>

          {weddingDate && (
            <p className="text-xl sm:text-2xl font-sans font-light mt-4">{weddingDate}</p>
          )}

          {(wedding.weddingLocation || wedding.city) && (
            <p className="text-lg font-sans text-opacity-80">
              {[wedding.weddingLocation, wedding.city, wedding.state].filter(Boolean).join(" · ")}
            </p>
          )}

          {wedding.weddingTime && (
            <p className="text-base font-sans" style={{ color: t.accent }}>
              {wedding.weddingTime}
            </p>
          )}

          <div
            className="w-24 h-px mx-auto mt-8"
            style={{ backgroundColor: t.accent }}
          />
        </div>
      </section>

      {/* Our Story Section */}
      {sectionMap.OUR_STORY && sectionMap.OUR_STORY.isVisible && (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-serif" style={{ color: t.accent }}>
              {sectionMap.OUR_STORY.title || "Our Story"}
            </h2>
            <div
              className="w-16 h-px mx-auto"
              style={{ backgroundColor: t.accent }}
            />
            {sectionMap.OUR_STORY.content ? (
              <p className="text-lg leading-relaxed font-sans whitespace-pre-wrap opacity-90">
                {sectionMap.OUR_STORY.content}
              </p>
            ) : wedding.story ? (
              <p className="text-lg leading-relaxed font-sans whitespace-pre-wrap opacity-90">
                {wedding.story}
              </p>
            ) : null}
          </div>
        </section>
      )}

      {/* Schedule / Ceremony Details */}
      {sectionMap.SCHEDULE && sectionMap.SCHEDULE.isVisible && (
        <section
          className="py-20 px-6"
          style={{ backgroundColor: t.border + "40" }}
        >
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-serif" style={{ color: t.accent }}>
              {sectionMap.SCHEDULE.title || "The Schedule"}
            </h2>
            <div className="w-16 h-px mx-auto" style={{ backgroundColor: t.accent }} />
            {sectionMap.SCHEDULE.content ? (
              <div className="font-sans whitespace-pre-wrap opacity-90 text-base leading-loose">
                {sectionMap.SCHEDULE.content}
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {weddingDate && (
                  <div>
                    <p className="font-semibold text-lg">{weddingDate}</p>
                    {wedding.weddingTime && (
                      <p className="opacity-80">{wedding.weddingTime}</p>
                    )}
                    {wedding.weddingLocation && (
                      <p className="opacity-80">{wedding.weddingLocation}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Travel Info */}
      {sectionMap.TRAVEL && sectionMap.TRAVEL.isVisible && sectionMap.TRAVEL.content && (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-serif" style={{ color: t.accent }}>
              {sectionMap.TRAVEL.title || "Travel & Accommodations"}
            </h2>
            <div className="w-16 h-px mx-auto" style={{ backgroundColor: t.accent }} />
            <p className="font-sans whitespace-pre-wrap opacity-90 text-base leading-relaxed">
              {sectionMap.TRAVEL.content}
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {sectionMap.FAQ && sectionMap.FAQ.isVisible && sectionMap.FAQ.content && (
        <section
          className="py-20 px-6"
          style={{ backgroundColor: t.border + "40" }}
        >
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-serif" style={{ color: t.accent }}>
              {sectionMap.FAQ.title || "Frequently Asked Questions"}
            </h2>
            <div className="w-16 h-px mx-auto" style={{ backgroundColor: t.accent }} />
            <div className="font-sans text-left whitespace-pre-wrap opacity-90 text-base leading-relaxed">
              {sectionMap.FAQ.content}
            </div>
          </div>
        </section>
      )}

      {/* Registry Links */}
      {sectionMap.REGISTRY && sectionMap.REGISTRY.isVisible && sectionMap.REGISTRY.content && (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-serif" style={{ color: t.accent }}>
              {sectionMap.REGISTRY.title || "Registry"}
            </h2>
            <div className="w-16 h-px mx-auto" style={{ backgroundColor: t.accent }} />
            <p className="font-sans whitespace-pre-wrap opacity-90 text-base">
              {sectionMap.REGISTRY.content}
            </p>
          </div>
        </section>
      )}

      {/* RSVP Section */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: t.border + "50" }}
      >
        <div className="max-w-lg mx-auto">
          <div className="text-center space-y-4 mb-10">
            <h2 className="text-4xl font-serif" style={{ color: t.accent }}>
              RSVP
            </h2>
            <div className="w-16 h-px mx-auto" style={{ backgroundColor: t.accent }} />
            <p className="font-sans opacity-80">
              We hope to celebrate with you. Please let us know if you can make it.
            </p>
          </div>
          <PublicRSVPForm slug={params.slug} themeAccent={t.accent} themeBorder={t.border} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center font-sans">
        <div className="space-y-2">
          <p className="text-2xl font-serif" style={{ color: t.accent }}>
            {wedding.partnerOneName} & {wedding.partnerTwoName}
          </p>
          {weddingDate && (
            <p className="text-sm opacity-60">{weddingDate}</p>
          )}
          <p className="text-xs opacity-40 mt-4">Made with love using GettinHitched</p>
        </div>
      </footer>
    </div>
  )
}
