import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useApp } from "../../contexts/AppContext"

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function DashboardScreen() {
  const { wedding, events, user } = useApp()
  const router = useRouter()

  const days = daysUntil(wedding?.weddingDate ?? null)

  const QUICK_ACTIONS = [
    { label: "Guests", emoji: "👥", href: "/guests" as const },
    { label: "Budget", emoji: "💰", href: "/budget" as const },
    { label: "Tasks", emoji: "✅", href: "/tasks" as const },
    { label: "More", emoji: "☰", href: "/more" as const },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>💍 GettinHitched</Text>
          <Text style={styles.subtitle}>
            {wedding
              ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
              : "Your wedding planning hub"}
          </Text>
        </View>

        {/* Countdown */}
        <View style={styles.countdownCard}>
          {days !== null ? (
            <>
              <Text style={styles.countdownDays}>{days > 0 ? days : 0}</Text>
              <Text style={styles.countdownLabel}>
                {days > 0 ? "Days Until Your Wedding" : days === 0 ? "Today is the Day! 🎉" : "Congratulations! 🎊"}
              </Text>
              {wedding?.weddingDate && (
                <Text style={styles.countdownSub}>
                  {new Date(wedding.weddingDate).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.countdownDays}>–</Text>
              <Text style={styles.countdownLabel}>Days Until Your Wedding</Text>
              <TouchableOpacity onPress={() => router.push("/settings")}>
                <Text style={[styles.countdownSub, { color: "#C9A96E", fontWeight: "600" }]}>
                  Set wedding date in Settings →
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Events */}
        {events.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Your Events</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
              {events.map(event => (
                <View key={event.id} style={styles.eventCard}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventType}>{event.type.replace(/_/g, " ")}</Text>
                  {event.date && (
                    <Text style={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.href)}
            >
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wedding info */}
        {wedding && (
          <>
            <Text style={styles.sectionLabel}>Wedding Info</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Couple" value={`${wedding.partnerOneName} & ${wedding.partnerTwoName}`} />
              {wedding.city && <InfoRow label="Location" value={[wedding.city, wedding.state].filter(Boolean).join(", ")} />}
              {events.length > 0 && <InfoRow label="Events" value={`${events.length} event${events.length === 1 ? "" : "s"} planned`} />}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F5EDE3" }}>
      <Text style={{ color: "#8B7355", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: "#3D2B1F", fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: { padding: 20, paddingBottom: 12 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#3D2B1F" },
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
  eventsScroll: { paddingLeft: 16 },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
    minWidth: 130,
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  eventName: { fontSize: 14, fontWeight: "700", color: "#3D2B1F" },
  eventType: { fontSize: 11, color: "#8B7355", marginTop: 2, textTransform: "uppercase" },
  eventDate: { fontSize: 12, color: "#C9A96E", marginTop: 6, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  actionCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  actionEmoji: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#3D2B1F" },
  infoCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
})
