import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: "Venue", color: "#C9A96E", icon: "🏛️", sortOrder: 0, budgetAmount: "0" },
  { name: "Catering & Bar", color: "#E8B4B8", icon: "🍽️", sortOrder: 1, budgetAmount: "0" },
  { name: "Photography", color: "#8fad8f", icon: "📷", sortOrder: 2, budgetAmount: "0" },
  { name: "Videography", color: "#a6bda6", icon: "🎥", sortOrder: 3, budgetAmount: "0" },
  { name: "Flowers & Florals", color: "#f9a8c9", icon: "💐", sortOrder: 4, budgetAmount: "0" },
  { name: "Music & Entertainment", color: "#7a9b7a", icon: "🎵", sortOrder: 5, budgetAmount: "0" },
  { name: "Attire & Accessories", color: "#D4B896", icon: "👗", sortOrder: 6, budgetAmount: "0" },
  { name: "Hair & Makeup", color: "#ff93ae", icon: "💄", sortOrder: 7, budgetAmount: "0" },
  { name: "Cake & Desserts", color: "#f7e7ce", icon: "🎂", sortOrder: 8, budgetAmount: "0" },
  { name: "Invitations & Stationery", color: "#ccdacc", icon: "✉️", sortOrder: 9, budgetAmount: "0" },
  { name: "Transportation", color: "#a6bda6", icon: "🚗", sortOrder: 10, budgetAmount: "0" },
  { name: "Jewelry & Rings", color: "#C9A96E", icon: "💍", sortOrder: 11, budgetAmount: "0" },
  { name: "Honeymoon", color: "#7a9b7a", icon: "✈️", sortOrder: 12, budgetAmount: "0" },
  { name: "Miscellaneous", color: "#8B7355", icon: "📦", sortOrder: 13, budgetAmount: "0" },
]

const DEFAULT_TASKS = [
  // 12+ months before
  { title: "Set your wedding date", category: "Getting Started", monthsBefore: 14, priority: "HIGH" },
  { title: "Determine your overall budget", category: "Budget", monthsBefore: 14, priority: "HIGH" },
  { title: "Create your guest list (rough draft)", category: "Guests", monthsBefore: 14, priority: "HIGH" },
  { title: "Start researching venues", category: "Venue", monthsBefore: 14, priority: "HIGH" },
  { title: "Book your ceremony and reception venues", category: "Venue", monthsBefore: 12, priority: "URGENT" },
  { title: "Hire a wedding planner (if desired)", category: "Vendors", monthsBefore: 12, priority: "HIGH" },
  { title: "Choose your wedding party", category: "Wedding Party", monthsBefore: 12, priority: "MEDIUM" },
  { title: "Start dress/suit shopping", category: "Attire", monthsBefore: 12, priority: "HIGH" },
  { title: "Book your photographer", category: "Vendors", monthsBefore: 12, priority: "URGENT" },
  { title: "Book your videographer", category: "Vendors", monthsBefore: 12, priority: "HIGH" },

  // 9 months before
  { title: "Book your caterer", category: "Vendors", monthsBefore: 9, priority: "URGENT" },
  { title: "Book your florist", category: "Vendors", monthsBefore: 9, priority: "HIGH" },
  { title: "Book your DJ or band", category: "Vendors", monthsBefore: 9, priority: "HIGH" },
  { title: "Book your officiant", category: "Vendors", monthsBefore: 9, priority: "HIGH" },
  { title: "Order your wedding dress", category: "Attire", monthsBefore: 9, priority: "URGENT" },
  { title: "Book your hotel room block for guests", category: "Guests", monthsBefore: 9, priority: "HIGH" },
  { title: "Start planning your honeymoon", category: "Honeymoon", monthsBefore: 9, priority: "MEDIUM" },
  { title: "Create your gift registry", category: "Registry", monthsBefore: 9, priority: "MEDIUM" },
  { title: "Set up a wedding website", category: "Digital", monthsBefore: 9, priority: "MEDIUM" },
  { title: "Send save-the-dates", category: "Invitations", monthsBefore: 9, priority: "HIGH" },

  // 6 months before
  { title: "Finalize your guest list", category: "Guests", monthsBefore: 6, priority: "HIGH" },
  { title: "Plan your ceremony details", category: "Ceremony", monthsBefore: 6, priority: "HIGH" },
  { title: "Book hair and makeup artist", category: "Vendors", monthsBefore: 6, priority: "HIGH" },
  { title: "Book cake/dessert baker", category: "Vendors", monthsBefore: 6, priority: "HIGH" },
  { title: "Book transportation", category: "Vendors", monthsBefore: 6, priority: "MEDIUM" },
  { title: "Order bridesmaid dresses", category: "Attire", monthsBefore: 6, priority: "HIGH" },
  { title: "Book suits/tuxedos for groomsmen", category: "Attire", monthsBefore: 6, priority: "HIGH" },
  { title: "Book honeymoon travel", category: "Honeymoon", monthsBefore: 6, priority: "HIGH" },
  { title: "Plan rehearsal dinner", category: "Events", monthsBefore: 6, priority: "MEDIUM" },
  { title: "Purchase wedding rings", category: "Jewelry", monthsBefore: 6, priority: "HIGH" },

  // 4-5 months before
  { title: "Send wedding invitations", category: "Invitations", monthsBefore: 4, priority: "URGENT" },
  { title: "Schedule dress fittings", category: "Attire", monthsBefore: 4, priority: "HIGH" },
  { title: "Finalize ceremony details with officiant", category: "Ceremony", monthsBefore: 4, priority: "HIGH" },
  { title: "Plan reception timeline", category: "Reception", monthsBefore: 4, priority: "HIGH" },
  { title: "Order wedding favors", category: "Miscellaneous", monthsBefore: 4, priority: "MEDIUM" },
  { title: "Arrange wedding night accommodation", category: "Miscellaneous", monthsBefore: 4, priority: "MEDIUM" },

  // 3 months before
  { title: "Get marriage license (check requirements)", category: "Legal", monthsBefore: 3, priority: "HIGH" },
  { title: "Finalize seating chart", category: "Guests", monthsBefore: 3, priority: "HIGH" },
  { title: "Plan music playlist with DJ/band", category: "Vendors", monthsBefore: 3, priority: "MEDIUM" },
  { title: "Write personal vows", category: "Ceremony", monthsBefore: 3, priority: "HIGH" },
  { title: "Confirm all vendor details", category: "Vendors", monthsBefore: 3, priority: "HIGH" },
  { title: "Plan bachelor/bachelorette parties", category: "Events", monthsBefore: 3, priority: "MEDIUM" },
  { title: "Create shot list for photographer", category: "Vendors", monthsBefore: 3, priority: "MEDIUM" },
  { title: "Order ceremony programs", category: "Stationery", monthsBefore: 3, priority: "MEDIUM" },

  // 1 month before
  { title: "Final dress fitting", category: "Attire", monthsBefore: 1, priority: "URGENT" },
  { title: "Confirm RSVP count with caterer", category: "Vendors", monthsBefore: 1, priority: "HIGH" },
  { title: "Finalize menu choices", category: "Vendors", monthsBefore: 1, priority: "HIGH" },
  { title: "Prepare final payment for vendors", category: "Budget", monthsBefore: 1, priority: "HIGH" },
  { title: "Create wedding day emergency kit", category: "Day-Of", monthsBefore: 1, priority: "MEDIUM" },
  { title: "Send final guest count to venue", category: "Venue", monthsBefore: 1, priority: "HIGH" },
  { title: "Prepare vendor tips in envelopes", category: "Budget", monthsBefore: 1, priority: "HIGH" },
  { title: "Assign someone to manage day-of details", category: "Day-Of", monthsBefore: 1, priority: "HIGH" },
  { title: "Pack for honeymoon", category: "Honeymoon", monthsBefore: 1, priority: "MEDIUM" },
  { title: "Confirm honeymoon reservations", category: "Honeymoon", monthsBefore: 1, priority: "HIGH" },

  // 1 week before
  { title: "Attend rehearsal and rehearsal dinner", category: "Events", monthsBefore: 0, priority: "URGENT" },
  { title: "Confirm all vendors one final time", category: "Vendors", monthsBefore: 0, priority: "HIGH" },
  { title: "Get beauty treatments (mani/pedi, etc.)", category: "Beauty", monthsBefore: 0, priority: "MEDIUM" },
  { title: "Pick up wedding dress", category: "Attire", monthsBefore: 0, priority: "URGENT" },
  { title: "Pick up wedding rings", category: "Jewelry", monthsBefore: 0, priority: "URGENT" },
  { title: "Prepare wedding day timeline for wedding party", category: "Day-Of", monthsBefore: 0, priority: "HIGH" },
  { title: "Get a good night sleep!", category: "Getting Started", monthsBefore: 0, priority: "HIGH" },
]

const DEFAULT_NAME_CHANGE_ITEMS = [
  "Social Security Card",
  "Driver's License / State ID",
  "Passport",
  "Bank Accounts & Credit Cards",
  "Voter Registration",
  "Work / HR Records",
  "Health Insurance",
  "Life Insurance",
  "Retirement Accounts & Beneficiaries",
  "Car Title & Registration",
  "Mortgage / Lease Agreement",
  "Tax Records (IRS)",
  "Email Address",
  "Social Media Profiles",
  "Medical Records",
  "Dental Records",
  "Loyalty Program Accounts",
  "Subscriptions & Memberships",
]

async function main() {
  console.log("Seed complete — templates stored in constants, not DB.")
  console.log("To seed a specific wedding, call seedWedding(weddingId) after creation.")
}

export async function seedWedding(weddingId: string) {
  // Create default expense categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.expenseCategory.create({
      data: { weddingId, ...cat },
    })
  }

  // Create default checklist tasks
  for (let i = 0; i < DEFAULT_TASKS.length; i++) {
    const task = DEFAULT_TASKS[i]
    await prisma.task.create({
      data: {
        weddingId,
        title: task.title,
        category: task.category,
        monthsBefore: task.monthsBefore,
        priority: task.priority,
        isTemplate: true,
        sortOrder: i,
      },
    })
  }

  // Create legal checklist with name change items
  await prisma.legalChecklist.create({
    data: {
      weddingId,
      nameChangeItems: JSON.stringify(
        DEFAULT_NAME_CHANGE_ITEMS.map((item) => ({ item, done: false }))
      ),
    },
  })

  // Create default website sections
  const sections = [
    { type: "hero", title: "Welcome", sortOrder: 0 },
    { type: "our_story", title: "Our Story", sortOrder: 1 },
    { type: "schedule", title: "Wedding Schedule", sortOrder: 2 },
    { type: "registry", title: "Gift Registry", sortOrder: 3 },
    { type: "travel", title: "Travel & Accommodations", sortOrder: 4 },
    { type: "faq", title: "FAQ", sortOrder: 5 },
    { type: "photos", title: "Photos", sortOrder: 6 },
  ]
  for (const section of sections) {
    await prisma.websiteSection.create({ data: { weddingId, ...section } })
  }

  // Create default honeymoon plan
  await prisma.honeymoonPlan.create({ data: { weddingId } })

  // Create default ceremony detail
  await prisma.ceremonyDetail.create({ data: { weddingId } })

  // Create default reception detail
  await prisma.receptionDetail.create({ data: { weddingId } })

  // Create default engagement detail
  await prisma.engagementDetail.create({ data: { weddingId } })

  // Create default albums
  const albums = [
    { name: "Engagement Photos", category: "ENGAGEMENT", sortOrder: 0 },
    { name: "Dress Inspiration", category: "INSPIRATION_DRESS", sortOrder: 1 },
    { name: "Flower Inspiration", category: "INSPIRATION_FLOWERS", sortOrder: 2 },
    { name: "Venue Inspiration", category: "INSPIRATION_VENUE", sortOrder: 3 },
    { name: "Cake Inspiration", category: "INSPIRATION_CAKE", sortOrder: 4 },
    { name: "Decor Inspiration", category: "INSPIRATION_DECOR", sortOrder: 5 },
    { name: "Hair & Makeup Inspiration", category: "INSPIRATION_HAIR", sortOrder: 6 },
  ]
  for (const album of albums) {
    await prisma.album.create({ data: { weddingId, ...album } })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
