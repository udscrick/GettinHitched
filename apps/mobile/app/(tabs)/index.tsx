import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const QUICK_ACTIONS = [
  { label: "Guests", emoji: "👥", href: "/guests" },
  { label: "Budget", emoji: "💰", href: "/budget" },
  { label: "Tasks", emoji: "✅", href: "/tasks" },
  { label: "Gallery", emoji: "📸", href: "/gallery" },
]

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>💍 GettinHitched</Text>
          <Text style={styles.subtitle}>Your wedding planning hub</Text>
        </View>

        {/* Countdown placeholder */}
        <View style={styles.countdownCard}>
          <Text style={styles.countdownDays}>–</Text>
          <Text style={styles.countdownLabel}>Days Until Your Wedding</Text>
          <Text style={styles.countdownSub}>Set your date in settings</Text>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionCard}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <Text style={styles.sectionLabel}>At a Glance</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Guests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$0</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: { padding: 20, paddingBottom: 12 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#3D2B1F" },
  subtitle: { fontSize: 14, color: "#8B7355", marginTop: 4 },
  countdownCard: {
    margin: 16,
    backgroundColor: "#f7e7ce",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  countdownDays: { fontSize: 64, fontWeight: "700", color: "#C9A96E" },
  countdownLabel: { fontSize: 16, fontWeight: "600", color: "#3D2B1F" },
  countdownSub: { fontSize: 13, color: "#8B7355", marginTop: 4 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B7355",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  actionEmoji: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#3D2B1F" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#C9A96E" },
  statLabel: { fontSize: 12, color: "#8B7355", marginTop: 2 },
})
