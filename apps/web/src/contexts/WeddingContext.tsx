"use client"

import { createContext, useContext, type ReactNode } from "react"

export interface WeddingContextType {
  wedding: {
    id: string
    slug: string
    partnerOneName: string
    partnerTwoName: string
    weddingDate: Date | null
    city: string | null
    state: string | null
    coverPhotoUrl: string | null
    websiteEnabled: boolean
    websiteTheme: string
    story: string | null
    currency: string
    totalBudget: string | null
  } | null
  memberRole: string | null
}

const WeddingContext = createContext<WeddingContextType>({
  wedding: null,
  memberRole: null,
})

export function WeddingProvider({
  children,
  value,
}: {
  children: ReactNode
  value: WeddingContextType
}) {
  return (
    <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>
  )
}

export function useWedding() {
  return useContext(WeddingContext)
}
