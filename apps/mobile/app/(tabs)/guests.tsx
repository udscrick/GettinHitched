import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Users } from "lucide-react-native"

const RSVP_COLORS: Record<string, string> = {
  ATTENDING: "#10b981",
  DECLINED: "#ef4444",
  PENDING: "#f59e0b",
  MAYBE: "#6b7280",
}

export default function GuestsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Guests</Text>
          <Text style={styles.subtitle}>Manage your guest list</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#d1fae5" }]}>
          <Text style={[styles.statNum, { color: "#10b981" }]}>0</Text>
          <Text style={styles.statLbl}>Attending</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#fee2e2" }]}>
          <Text style={[styles.statNum, { color: "#ef4444" }]}>0</Text>
          <Text style={styles.statLbl}>Declined</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#fef3c7" }]}>
          <Text style={[styles.statNum, { color: "#f59e0b" }]}>0</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
      </View>

      {/* Empty state */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>No guests yet</Text>
        <Text style={styles.emptySubtitle}>Add your guest list to track RSVPs and seating</Text>
        <TouchableOpacity style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>Add First Guest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#3D2B1F" },
  subtitle: { fontSize: 14, color: "#8B7355", marginTop: 2 },
  addBtn: {
    backgroundColor: "#C9A96E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: "#f7e7ce",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "700", color: "#C9A96E" },
  statLbl: { fontSize: 10, color: "#8B7355", marginTop: 2 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: "#C9A96E",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
})
