import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useApp } from "../../contexts/AppContext"

const MENU_ITEMS = [
  { emoji: "🏛️", label: "Venues", desc: "Research & compare venues", href: "/venues" },
  { emoji: "🛍️", label: "Vendors", desc: "Photographers, caterers & more", href: "/vendors" },
  { emoji: "💐", label: "Ceremony", desc: "Program, vows & music", href: "/ceremony" },
  { emoji: "🎉", label: "Reception", desc: "Timeline & dinner menu", href: "/reception" },
  { emoji: "💎", label: "Wedding Party", desc: "Bridal & groom's party", href: "/wedding-party" },
  { emoji: "🎁", label: "Registry", desc: "Gift registry & thank-yous", href: "/registry" },
  { emoji: "✉️", label: "Invitations", desc: "Track invites & RSVPs", href: "/invitations" },
  { emoji: "💍", label: "Engagement", desc: "Proposal story & party", href: "/engagement" },
  { emoji: "✈️", label: "Honeymoon", desc: "Destination & packing list", href: "/honeymoon" },
  { emoji: "📋", label: "Legal & Docs", desc: "Licenses & name change", href: "/legal" },
  { emoji: "🌐", label: "Wedding Website", desc: "Public RSVP site", href: "/website" },
  { emoji: "📝", label: "Notes", desc: "Notes & communications", href: "/notes" },
  { emoji: "📊", label: "Reports", desc: "Budget & guest analytics", href: "/reports" },
  { emoji: "⚙️", label: "Settings", desc: "Wedding details & collaborators", href: "/settings" },
] as const

export default function MoreScreen() {
  const router = useRouter()
  const { user, signOut } = useApp()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>All planning sections</Text>
        </View>
        {user && (
          <Text style={styles.userName}>{user.name ?? user.email}</Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => router.push(item.href)}
          >
            <Text style={styles.menuEmoji}>{item.emoji}</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.menuItem, styles.signOutItem]}
          onPress={() => {
            signOut()
          }}
        >
          <Text style={styles.menuEmoji}>🚪</Text>
          <View style={styles.menuText}>
            <Text style={[styles.menuLabel, { color: "#ef4444" }]}>Sign Out</Text>
            <Text style={styles.menuDesc}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: { padding: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "700", color: "#3D2B1F" },
  subtitle: { fontSize: 14, color: "#8B7355", marginTop: 2 },
  userName: { fontSize: 13, color: "#8B7355", maxWidth: 140, textAlign: "right" },
  menuItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    marginHorizontal: 16, marginBottom: 8, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#EDE0D4",
  },
  signOutItem: { marginTop: 8, borderColor: "#fee2e2", backgroundColor: "#fff5f5" },
  menuEmoji: { fontSize: 24, marginRight: 12 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  menuDesc: { fontSize: 13, color: "#8B7355", marginTop: 2 },
  menuArrow: { fontSize: 20, color: "#C9A96E", marginLeft: 8 },
})
