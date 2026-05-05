import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const MENU_ITEMS = [
  { emoji: "🏛️", label: "Venues", desc: "Research & compare venues" },
  { emoji: "🛍️", label: "Vendors", desc: "Photographers, caterers & more" },
  { emoji: "💐", label: "Ceremony", desc: "Program, vows & music" },
  { emoji: "🎉", label: "Reception", desc: "Timeline & dinner menu" },
  { emoji: "💎", label: "Wedding Party", desc: "Bridal & groom's party" },
  { emoji: "📸", label: "Gallery", desc: "Photos & inspiration boards" },
  { emoji: "🎁", label: "Registry", desc: "Gift registry & thank-yous" },
  { emoji: "✉️", label: "Invitations", desc: "Track invites & RSVPs" },
  { emoji: "💍", label: "Engagement", desc: "Proposal story & party" },
  { emoji: "✈️", label: "Honeymoon", desc: "Destination & packing list" },
  { emoji: "📋", label: "Legal & Docs", desc: "Licenses & name change" },
  { emoji: "🌐", label: "Wedding Website", desc: "Public RSVP site" },
  { emoji: "📊", label: "Reports", desc: "Budget & guest analytics" },
  { emoji: "⚙️", label: "Settings", desc: "Wedding details & collaborators" },
]

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>All planning sections</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Text style={styles.menuEmoji}>{item.emoji}</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#3D2B1F" },
  subtitle: { fontSize: 14, color: "#8B7355", marginTop: 2 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  menuEmoji: { fontSize: 24, marginRight: 12 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  menuDesc: { fontSize: 13, color: "#8B7355", marginTop: 2 },
  menuArrow: { fontSize: 20, color: "#C9A96E", marginLeft: 8 },
})
