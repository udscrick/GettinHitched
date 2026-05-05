import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function BudgetScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Track your wedding expenses</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Budget overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Total Budget</Text>
          <Text style={styles.overviewAmount}>$0</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "0%" }]} />
          </View>
          <View style={styles.overviewRow}>
            <View>
              <Text style={styles.overviewSub}>Spent</Text>
              <Text style={styles.overviewSubAmt}>$0</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.overviewSub}>Remaining</Text>
              <Text style={[styles.overviewSubAmt, { color: "#10b981" }]}>$0</Text>
            </View>
          </View>
        </View>

        {/* Empty state */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💰</Text>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your wedding expenses to stay on budget
          </Text>
          <TouchableOpacity style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Add First Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  overviewCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EDE0D4",
  },
  overviewLabel: { fontSize: 13, color: "#8B7355" },
  overviewAmount: { fontSize: 40, fontWeight: "700", color: "#3D2B1F", marginTop: 4 },
  progressTrack: {
    height: 8,
    backgroundColor: "#f7e7ce",
    borderRadius: 4,
    marginVertical: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#C9A96E",
    borderRadius: 4,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewSub: { fontSize: 12, color: "#8B7355" },
  overviewSubAmt: { fontSize: 16, fontWeight: "600", color: "#3D2B1F", marginTop: 2 },
  emptyState: {
    alignItems: "center",
    padding: 32,
    paddingTop: 16,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: "#C9A96E",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
})
