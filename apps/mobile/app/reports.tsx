import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { useApp } from "../contexts/AppContext"
import { guestsApi, budgetApi, tasksApi, Guest, Expense, ExpenseCategory, Task } from "../lib/api"

interface EventSummary {
  id: string
  name: string
  guests: { total: number; confirmed: number; declined: number; pending: number }
  budget: { total: number; paid: number; estimated: number }
  tasks: { total: number; done: number }
}

export default function ReportsScreen() {
  const { events } = useApp()
  const [summaries, setSummaries] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (events.length === 0) { setLoading(false); return }
    Promise.all(
      events.map(async event => {
        const [guestRes, budgetRes, taskRes] = await Promise.all([
          guestsApi.list(event.id).catch(() => ({ guests: [] as Guest[] })),
          budgetApi.get(event.id).catch(() => ({ categories: [] as ExpenseCategory[], expenses: [] as Expense[] })),
          tasksApi.list(event.id).catch(() => ({ tasks: [] as Task[] })),
        ])

        const guests = guestRes.guests
        const expenses = budgetRes.expenses
        const tasks = taskRes.tasks

        const totalBudget = budgetRes.categories.reduce((s, c) => s + parseFloat(c.budgetAmount ?? "0"), 0)
        const totalPaid = expenses.reduce((s, e) => s + parseFloat(e.paidAmount ?? "0"), 0)
        const totalEstimated = expenses.reduce((s, e) => s + parseFloat(e.totalAmount ?? "0"), 0)

        return {
          id: event.id,
          name: event.name,
          guests: {
            total: guests.length,
            confirmed: guests.filter(g => g.rsvpStatus === "CONFIRMED").length,
            declined: guests.filter(g => g.rsvpStatus === "DECLINED").length,
            pending: guests.filter(g => g.rsvpStatus === "PENDING").length,
          },
          budget: { total: totalBudget, paid: totalPaid, estimated: totalEstimated },
          tasks: { total: tasks.length, done: tasks.filter(t => t.isCompleted).length },
        } satisfies EventSummary
      })
    )
      .then(setSummaries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [events])

  const overall = summaries.reduce(
    (acc, s) => ({
      guests: acc.guests + s.guests.total,
      confirmed: acc.confirmed + s.guests.confirmed,
      budget: acc.budget + s.budget.total,
      paid: acc.paid + s.budget.paid,
      tasks: acc.tasks + s.tasks.total,
      done: acc.done + s.tasks.done,
    }),
    { guests: 0, confirmed: 0, budget: 0, paid: 0, tasks: 0, done: 0 }
  )

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Reports" }} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Overall Summary</Text>
          <View style={styles.overallGrid}>
            <StatCard label="Total Guests" value={overall.guests} sub={`${overall.confirmed} confirmed`} />
            <StatCard label="Budget Paid" value={`₹${fmt(overall.paid)}`} sub={`of ₹${fmt(overall.budget)}`} />
            <StatCard label="Tasks Done" value={`${overall.done}/${overall.tasks}`} sub={overall.tasks > 0 ? `${Math.round(overall.done / overall.tasks * 100)}% complete` : "—"} />
            <StatCard label="Events" value={events.length} sub="total" />
          </View>

          {summaries.map(s => (
            <View key={s.id}>
              <Text style={styles.sectionLabel}>{s.name}</Text>
              <View style={styles.card}>
                <SectionRow label="Guests" value={`${s.guests.total} total`} />
                <View style={styles.rsvpBar}>
                  {s.guests.total > 0 && (
                    <>
                      <View style={[styles.rsvpSegment, { flex: s.guests.confirmed, backgroundColor: "#10b981" }]} />
                      <View style={[styles.rsvpSegment, { flex: s.guests.declined, backgroundColor: "#ef4444" }]} />
                      <View style={[styles.rsvpSegment, { flex: s.guests.pending, backgroundColor: "#EDE0D4" }]} />
                    </>
                  )}
                </View>
                <View style={styles.rsvpLegend}>
                  <LegendItem color="#10b981" label={`${s.guests.confirmed} confirmed`} />
                  <LegendItem color="#ef4444" label={`${s.guests.declined} declined`} />
                  <LegendItem color="#B8A898" label={`${s.guests.pending} pending`} />
                </View>
                <View style={styles.divider} />
                <SectionRow label="Budget" value={`₹${fmt(s.budget.total)} total`} />
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetSub}>Paid: <Text style={styles.budgetPaid}>₹{fmt(s.budget.paid)}</Text></Text>
                  <Text style={styles.budgetSub}>Estimated: ₹{fmt(s.budget.estimated)}</Text>
                </View>
                {s.budget.total > 0 && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { flex: Math.min(s.budget.paid / s.budget.total, 1) }]} />
                  </View>
                )}
                <View style={styles.divider} />
                <SectionRow label="Tasks" value={`${s.tasks.done}/${s.tasks.total} done`} />
                {s.tasks.total > 0 && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { backgroundColor: "#C9A96E", flex: s.tasks.done / s.tasks.total }]} />
                  </View>
                )}
              </View>
            </View>
          ))}

          {summaries.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptySubtitle}>Add events, guests, and tasks to see reports</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(Math.round(n))
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  )
}

function SectionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionRowLabel}>{label}</Text>
      <Text style={styles.sectionRowValue}>{value}</Text>
    </View>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 11, color: "#8B7355" }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  content: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  overallGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#EDE0D4", alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#C9A96E" },
  statLabel: { fontSize: 12, color: "#3D2B1F", fontWeight: "600", marginTop: 2 },
  statSub: { fontSize: 11, color: "#8B7355", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#EDE0D4" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sectionRowLabel: { fontSize: 13, fontWeight: "600", color: "#3D2B1F" },
  sectionRowValue: { fontSize: 13, color: "#8B7355" },
  rsvpBar: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "#EDE0D4", marginBottom: 8 },
  rsvpSegment: { height: 8 },
  rsvpLegend: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  divider: { height: 1, backgroundColor: "#F5EDE3", marginVertical: 12 },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  budgetSub: { fontSize: 12, color: "#8B7355" },
  budgetPaid: { color: "#10b981", fontWeight: "600" },
  progressTrack: { flexDirection: "row", height: 6, borderRadius: 3, backgroundColor: "#EDE0D4", overflow: "hidden", marginBottom: 4 },
  progressFill: { backgroundColor: "#10b981", borderRadius: 3 },
  empty: { alignItems: "center", justifyContent: "center", padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#8B7355", textAlign: "center" },
})
