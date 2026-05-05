import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function TasksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Checklist</Text>
          <Text style={styles.subtitle}>Stay on track with your planning</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Task</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>0 of 0 tasks complete</Text>
          <Text style={styles.progressPct}>0%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "0%" }]} />
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>✅</Text>
        <Text style={styles.emptyTitle}>All set!</Text>
        <Text style={styles.emptySubtitle}>
          Your planning checklist will appear here. Tasks are automatically added based on your wedding date.
        </Text>
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
  progressCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: { fontSize: 14, color: "#3D2B1F" },
  progressPct: { fontSize: 14, fontWeight: "600", color: "#C9A96E" },
  progressTrack: {
    height: 8,
    backgroundColor: "#f7e7ce",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#C9A96E",
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 20,
  },
})
