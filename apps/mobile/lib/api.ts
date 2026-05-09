const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"
const COOKIE_NAME = "authjs.session-token"

let _token: string | null = null

export function setToken(token: string | null) {
  _token = token
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }
  if (_token) {
    headers["Cookie"] = `${COOKIE_NAME}=${_token}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal })

    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as Record<string, string>
      throw new Error(data.error ?? `Request failed: ${response.status}`)
    }

    return response.json()
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("Request timed out — check your server is running")
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; userId: string }>("/api/mobile/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () =>
    request<{ user: MeUser; wedding: Wedding | null; events: WeddingEvent[]; role: string | null }>("/api/mobile/auth/me"),
}

// ── Wedding ───────────────────────────────────────────────────────────────
export const weddingApi = {
  get: () => request<{ wedding: Wedding | null; role: string | null }>("/api/wedding"),
  create: (data: { partnerOneName: string; partnerTwoName: string; weddingDate?: string; city?: string; state?: string }) =>
    request<{ wedding: Wedding }>("/api/wedding", { method: "POST", body: JSON.stringify(data) }),
  update: (data: Partial<Wedding>) =>
    request<{ wedding: Wedding }>("/api/wedding", { method: "PATCH", body: JSON.stringify(data) }),
}

// ── Events ────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: () => request<{ events: WeddingEvent[] }>("/api/events"),
  create: (data: { name: string; type?: string; date?: string; location?: string; description?: string }) =>
    request<{ event: WeddingEvent }>("/api/events", { method: "POST", body: JSON.stringify(data) }),
}

// ── Guests ────────────────────────────────────────────────────────────────
export const guestsApi = {
  list: (eventId: string) =>
    request<{ guests: Guest[] }>(`/api/events/${eventId}/guests`),
  create: (eventId: string, data: Partial<Guest>) =>
    request<{ guest: Guest }>(`/api/events/${eventId}/guests`, { method: "POST", body: JSON.stringify(data) }),
  update: (eventId: string, id: string, data: Partial<Guest>) =>
    request<{ guest: Guest }>(`/api/events/${eventId}/guests`, { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (eventId: string, id: string) =>
    request(`/api/events/${eventId}/guests?id=${id}`, { method: "DELETE" }),
}

// ── Budget ────────────────────────────────────────────────────────────────
export const budgetApi = {
  get: (eventId: string) =>
    request<{ categories: ExpenseCategory[]; expenses: Expense[] }>(`/api/events/${eventId}/budget`),
  createExpense: (eventId: string, data: Partial<Expense>) =>
    request<{ expense: Expense }>(`/api/events/${eventId}/budget`, { method: "POST", body: JSON.stringify(data) }),
  createCategory: (eventId: string, data: Partial<ExpenseCategory>) =>
    request<{ category: ExpenseCategory }>(`/api/events/${eventId}/budget`, {
      method: "POST",
      body: JSON.stringify({ type: "category", ...data }),
    }),
  updateExpense: (eventId: string, id: string, data: Partial<Expense>) =>
    request<{ expense: Expense }>(`/api/events/${eventId}/budget`, { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  deleteExpense: (eventId: string, id: string) =>
    request(`/api/events/${eventId}/budget?id=${id}`, { method: "DELETE" }),
}

// ── Tasks ─────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (eventId: string) =>
    request<{ tasks: Task[] }>(`/api/events/${eventId}/tasks`),
  create: (eventId: string, data: Partial<Task>) =>
    request<{ task: Task }>(`/api/events/${eventId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  update: (eventId: string, id: string, data: Partial<Task>) =>
    request<{ task: Task }>(`/api/events/${eventId}/tasks`, { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (eventId: string, id: string) =>
    request(`/api/events/${eventId}/tasks?id=${id}`, { method: "DELETE" }),
}

// ── Vendors ───────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (eventId: string) =>
    request<{ vendors: Vendor[] }>(`/api/events/${eventId}/vendors`),
  create: (eventId: string, data: Partial<Vendor>) =>
    request<{ vendor: Vendor }>(`/api/events/${eventId}/vendors`, { method: "POST", body: JSON.stringify(data) }),
  update: (eventId: string, id: string, data: Partial<Vendor>) =>
    request<{ vendor: Vendor }>(`/api/events/${eventId}/vendors`, { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (eventId: string, id: string) =>
    request(`/api/events/${eventId}/vendors?id=${id}`, { method: "DELETE" }),
}

// ── Venues ────────────────────────────────────────────────────────────────
export const venuesApi = {
  list: (eventId: string) =>
    request<{ venues: Venue[] }>(`/api/venues?eventId=${eventId}`),
  create: (eventId: string, data: Partial<Venue>) =>
    request<{ venue: Venue }>("/api/venues", { method: "POST", body: JSON.stringify({ eventId, ...data }) }),
  update: (data: { id: string; eventId: string } & Partial<Venue>) =>
    request<{ venue: Venue }>("/api/venues", { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string, eventId: string) =>
    request(`/api/venues?id=${id}&eventId=${eventId}`, { method: "DELETE" }),
}

// ── Notes ─────────────────────────────────────────────────────────────────
export const notesApi = {
  list: () => request<{ notes: Note[] }>("/api/notes"),
  create: (data: Partial<Note>) =>
    request<{ note: Note }>("/api/notes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Note>) =>
    request<{ note: Note }>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/notes/${id}`, { method: "DELETE" }),
  pin: (id: string, isPinned: boolean) =>
    request(`/api/notes/${id}/pin`, { method: "PATCH", body: JSON.stringify({ isPinned }) }),
}

// ── Wedding Party ─────────────────────────────────────────────────────────
export const weddingPartyApi = {
  list: () => request<{ members: WeddingPartyMember[] }>("/api/wedding/party"),
  create: (data: Partial<WeddingPartyMember>) =>
    request<{ member: WeddingPartyMember }>("/api/wedding/party", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<WeddingPartyMember>) =>
    request<{ member: WeddingPartyMember }>("/api/wedding/party", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    request(`/api/wedding/party?id=${id}`, { method: "DELETE" }),
}

// ── Registry ──────────────────────────────────────────────────────────────
export const registryApi = {
  get: () => request<{ items: RegistryItem[]; gifts: GiftReceived[] }>("/api/wedding/registry"),
  createItem: (data: Partial<RegistryItem>) =>
    request<{ item: RegistryItem }>("/api/wedding/registry", { method: "POST", body: JSON.stringify(data) }),
  createGift: (data: Partial<GiftReceived>) =>
    request<{ gift: GiftReceived }>("/api/wedding/registry", { method: "POST", body: JSON.stringify({ type: "gift", ...data }) }),
  update: (id: string, data: Partial<RegistryItem>, type?: string) =>
    request<{ item: RegistryItem }>("/api/wedding/registry", { method: "PUT", body: JSON.stringify({ id, type, ...data }) }),
  delete: (id: string, type?: string) =>
    request(`/api/wedding/registry?id=${id}${type ? `&type=${type}` : ""}`, { method: "DELETE" }),
}

// ── Honeymoon ─────────────────────────────────────────────────────────────
export const honeymoonApi = {
  get: () => request<{ plan: HoneymoonPlan | null }>("/api/wedding/honeymoon"),
  update: (data: Partial<HoneymoonPlan>) =>
    request<{ plan: HoneymoonPlan }>("/api/wedding/honeymoon", { method: "PATCH", body: JSON.stringify(data) }),
  addDestination: (data: Partial<HoneymoonDestination>) =>
    request<{ destination: HoneymoonDestination }>("/api/wedding/honeymoon", { method: "POST", body: JSON.stringify(data) }),
  addPackingItem: (data: Partial<PackingItem>) =>
    request<{ item: PackingItem }>("/api/wedding/honeymoon", { method: "POST", body: JSON.stringify({ type: "packing", ...data }) }),
  delete: (id: string, type?: string) =>
    request(`/api/wedding/honeymoon?id=${id}${type ? `&type=${type}` : ""}`, { method: "DELETE" }),
}

// ── Invitations ───────────────────────────────────────────────────────────
export const invitationsApi = {
  list: () => request<{ batches: InvitationBatch[] }>("/api/invitations"),
}

// ── Legal ─────────────────────────────────────────────────────────────────
export const legalApi = {
  get: () => request<{ checklist: LegalChecklist | null }>("/api/legal"),
  update: (data: Partial<LegalChecklist>) =>
    request<{ checklist: LegalChecklist }>("/api/legal", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Ceremony ──────────────────────────────────────────────────────────────
export const ceremonyApi = {
  get: () => request<{ ceremony: CeremonyDetail | null }>("/api/ceremony"),
  update: (data: Partial<CeremonyDetail>) =>
    request<{ ceremony: CeremonyDetail }>("/api/ceremony", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Reception ─────────────────────────────────────────────────────────────
export const receptionApi = {
  get: () => request<{ reception: ReceptionDetail | null }>("/api/reception"),
  update: (data: Partial<ReceptionDetail>) =>
    request<{ reception: ReceptionDetail }>("/api/reception", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Engagement ────────────────────────────────────────────────────────────
export const engagementApi = {
  get: () => request<{ detail: EngagementDetail | null }>("/api/engagement"),
  update: (data: Partial<EngagementDetail>) =>
    request<{ detail: EngagementDetail }>("/api/engagement", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Website ───────────────────────────────────────────────────────────────
export const websiteApi = {
  get: () => request<{ website: WebsiteSettings | null; sections: WebsiteSection[] }>("/api/website"),
  update: (data: Partial<WebsiteSettings>) =>
    request<{ website: WebsiteSettings }>("/api/website", { method: "PUT", body: JSON.stringify(data) }),
}

// ── Domain types ──────────────────────────────────────────────────────────
export interface MeUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

export interface Wedding {
  id: string
  slug: string
  partnerOneName: string
  partnerTwoName: string
  weddingDate: string | null
  city: string | null
  state: string | null
  country: string
  story: string | null
  websiteEnabled: boolean
  websiteTheme: string
  websiteTitle: string | null
  websiteMessage: string | null
}

export interface WeddingEvent {
  id: string
  weddingId: string
  name: string
  type: string
  date: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  description: string | null
  sortOrder: number
  _count?: { guests: number; tasks: number; vendors: number; expenses: number }
}

export interface Guest {
  id: string
  eventId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  rsvpStatus: string
  side: string
  isChild: boolean
  dietaryRestriction: string | null
  notes: string | null
  tableId: string | null
  table?: { id: string; name: string } | null
}

export interface ExpenseCategory {
  id: string
  eventId: string
  name: string
  budgetAmount: string
  color: string
  icon: string | null
}

export interface Expense {
  id: string
  eventId: string
  categoryId: string | null
  title: string
  description: string | null
  totalAmount: string
  paidAmount: string
  status: string
  dueDate: string | null
  notes: string | null
  category?: ExpenseCategory | null
  vendor?: { id: string; name: string } | null
}

export interface Task {
  id: string
  eventId: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  dueDate: string | null
  priority: string
  category: string | null
  notes: string | null
}

export interface Vendor {
  id: string
  eventId: string
  name: string
  type: string
  status: string
  email: string | null
  phone: string | null
  website: string | null
  contactPerson: string | null
  price: string | null
  notes: string | null
  rating: number | null
  depositPaid: boolean
  depositAmount: string | null
}

export interface Venue {
  id: string
  eventId: string
  name: string
  status: string
  type: string
  address: string | null
  city: string | null
  state: string | null
  capacity: number | null
  rentalFeeMin: string | null
  rentalFeeMax: string | null
  notes: string | null
  pros: string | null
  cons: string | null
  rating: number | null
}

export interface Note {
  id: string
  weddingId: string
  title: string | null
  content: string
  isPinned: boolean
  category: string
  user?: { name: string | null; image: string | null }
}

export interface WeddingPartyMember {
  id: string
  weddingId: string
  name: string
  role: string
  side: string | null
  email: string | null
  phone: string | null
  duties: string | null
  notes: string | null
  outfitColor: string | null
  outfitStyle: string | null
  outfitStore: string | null
  outfitOrdered: boolean
  outfitPickedUp: boolean
}

export interface RegistryItem {
  id: string
  weddingId: string
  name: string
  price: string | null
  quantity: number
  purchased: number
  url: string | null
  store: string | null
  priority: string
  category: string | null
}

export interface GiftReceived {
  id: string
  weddingId: string
  giverName: string
  description: string | null
  value: string | null
  thankYouSent: boolean
  notes: string | null
}

export interface HoneymoonPlan {
  id: string
  weddingId: string
  departureDate: string | null
  returnDate: string | null
  budget: string | null
  notes: string | null
  destinations: HoneymoonDestination[]
  packingItems: PackingItem[]
}

export interface HoneymoonDestination {
  id: string
  honeymoonPlanId: string
  name: string
  country: string | null
  accommodation: string | null
  estimatedCost: string | null
  isBooked: boolean
  notes: string | null
}

export interface PackingItem {
  id: string
  honeymoonPlanId: string
  name: string
  category: string | null
  isPacked: boolean
  quantity: number
  forWho: string
}

export interface InvitationBatch {
  id: string
  eventId: string
  name: string
  type: string
  method: string
  sentAt: string | null
  rsvpDeadline: string | null
  notes: string | null
}

export interface LegalChecklist {
  id: string
  weddingId: string
  licenseState: string | null
  licenseObtained: boolean
  licenseDate: string | null
  waitingPeriodDays: number | null
  licenseExpiryDate: string | null
  nameChangeItems: string | null
  prenupStatus: string
  prenupNotes: string | null
  notes: string | null
}

export interface CeremonyDetail {
  id: string
  weddingId: string
  officiantName: string | null
  officiantType: string | null
  location: string | null
  startTime: string | null
  endTime: string | null
  notes: string | null
}

export interface ReceptionDetail {
  id: string
  weddingId: string
  location: string | null
  startTime: string | null
  notes: string | null
  firstDanceSong: string | null
  menu: string | null
  barDetails: string | null
}

export interface EngagementDetail {
  id: string
  weddingId: string
  proposalDate: string | null
  proposalLocation: string | null
  proposalStory: string | null
  ringDescription: string | null
  whoProposed: string | null
  engagementPartyDate: string | null
  engagementPartyVenue: string | null
  engagementPartyNotes: string | null
  notes: string | null
}

export interface WebsiteSettings {
  id: string
  slug: string
  websiteEnabled: boolean
  websiteTheme: string
  websiteTitle: string | null
  websiteMessage: string | null
}

export interface WebsiteSection {
  id: string
  weddingId: string
  type: string
  title: string | null
  content: string | null
  isVisible: boolean
  sortOrder: number
}
