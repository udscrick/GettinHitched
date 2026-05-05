// Shared types across web and mobile

export type MemberRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"

export type RSVPStatus = "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE"

export type GuestSide = "PARTNER_ONE" | "PARTNER_TWO" | "BOTH"

export type VendorType =
  | "PHOTOGRAPHER"
  | "VIDEOGRAPHER"
  | "CATERER"
  | "FLORIST"
  | "DJ"
  | "BAND"
  | "OFFICIANT"
  | "HAIR_MAKEUP"
  | "CAKE_BAKER"
  | "TRANSPORTATION"
  | "PLANNER"
  | "VENUE_COORDINATOR"
  | "STATIONER"
  | "JEWELER"
  | "DRESS_DESIGNER"
  | "SUIT_TAILOR"
  | "PHOTO_BOOTH"
  | "LIGHTING"
  | "RENTALS"
  | "TRAVEL_AGENT"
  | "OTHER"

export type VendorStatus =
  | "RESEARCHING"
  | "CONTACTED"
  | "MEETING_SCHEDULED"
  | "QUOTE_RECEIVED"
  | "BOOKED"
  | "CONTRACT_SIGNED"
  | "COMPLETED"
  | "CANCELLED"

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "REFUNDED"

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export type PartyRole =
  | "MAID_OF_HONOR"
  | "BEST_MAN"
  | "BRIDESMAID"
  | "GROOMSMAN"
  | "FLOWER_GIRL"
  | "RING_BEARER"
  | "JUNIOR_BRIDESMAID"
  | "JUNIOR_GROOMSMAN"
  | "OFFICIANT"
  | "READER"
  | "USHER"
  | "OTHER"

export interface WeddingBasic {
  id: string
  slug: string
  partnerOneName: string
  partnerTwoName: string
  weddingDate: string | null
  coverPhotoUrl: string | null
}

export interface GuestBasic {
  id: string
  firstName: string
  lastName: string
  rsvpStatus: RSVPStatus
  side: GuestSide
}
