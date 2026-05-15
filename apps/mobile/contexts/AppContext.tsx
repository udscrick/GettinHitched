import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { authApi, weddingApi, setToken, MeUser, Wedding, WeddingEvent } from "../lib/api"
import { storage } from "../lib/storage"

interface AppState {
  user: MeUser | null
  wedding: Wedding | null
  events: WeddingEvent[]
  activeEventId: string | null
  role: string | null
  isLoading: boolean
}

interface AppContextValue extends AppState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setActiveEventId: (id: string) => void
  refreshWedding: () => Promise<void>
  setWedding: (w: Wedding) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    wedding: null,
    events: [],
    activeEventId: null,
    role: null,
    isLoading: true,
  })

  const loadFromToken = useCallback(async (token: string) => {
    setToken(token)
    const { user, wedding, events, role } = await authApi.me()
    setState({
      user,
      wedding,
      events: events ?? [],
      activeEventId: events?.[0]?.id ?? null,
      role,
      isLoading: false,
    })
  }, [])

  useEffect(() => {
    storage.getToken().then(async (token) => {
      if (token) {
        try {
          await loadFromToken(token)
        } catch {
          await storage.clearToken()
          setToken(null)
          setState(s => ({ ...s, isLoading: false }))
        }
      } else {
        setState(s => ({ ...s, isLoading: false }))
      }
    })
  }, [loadFromToken])

  const signIn = async (email: string, password: string) => {
    const { token } = await authApi.login(email, password)
    await storage.setToken(token)
    await loadFromToken(token)
  }

  const signUp = async (name: string, email: string, password: string) => {
    const { token } = await authApi.register(name, email, password)
    await storage.setToken(token)
    await loadFromToken(token)
  }

  const signOut = async () => {
    await storage.clearToken()
    setToken(null)
    setState({
      user: null,
      wedding: null,
      events: [],
      activeEventId: null,
      role: null,
      isLoading: false,
    })
  }

  const setActiveEventId = (id: string) => {
    setState(s => ({ ...s, activeEventId: id }))
  }

  const refreshWedding = async () => {
    const { wedding, role } = await weddingApi.get()
    setState(s => ({ ...s, wedding, role }))
  }

  const setWedding = (wedding: Wedding) => {
    setState(s => ({ ...s, wedding }))
  }

  return (
    <AppContext.Provider value={{ ...state, signIn, signUp, signOut, setActiveEventId, refreshWedding, setWedding }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
