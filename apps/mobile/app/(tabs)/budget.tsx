import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback } from "react"
import { useApp } from "../../contexts/AppContext"
import { budgetApi, ExpenseCategory, Expense, WeddingEvent } from "../../lib/api"

function EventPicker({ events, activeId, onSelect }: {
  events: WeddingEvent[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
      {events.map(e => (
        <TouchableOpacity
          key={e.id}
          style={[styles.pickerChip, e.id === activeId && styles.pickerChipActive]}
          onPress={() => onSelect(e.id)}
        >
          <Text style={[styles.pickerText, e.id === activeId && styles.pickerTextActive]}>{e.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "#10b981",
  PARTIALLY_PAID: "#f59e0b",
  UNPAID: "#ef4444",
  OVERDUE: "#dc2626",
}

export default function BudgetScreen() {
  const { events, activeEventId, setActiveEventId } = useApp()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({ title: "", totalAmount: "", categoryId: "", notes: "" })

  const eventId = activeEventId

  const fetch = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { categories: cats, expenses: exps } = await budgetApi.get(eventId)
      setCategories(cats)
      setExpenses(exps)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetch() }, [fetch])

  const totalBudget = categories.reduce((s, c) => s + parseFloat(c.budgetAmount || "0"), 0)
  const totalEstimated = expenses.reduce((s, e) => s + parseFloat(e.totalAmount || "0"), 0)
  const totalPaid = expenses.reduce((s, e) => s + parseFloat(e.paidAmount || "0"), 0)
  const pct = totalBudget > 0 ? Math.min((totalEstimated / totalBudget) * 100, 100) : 0

  async function addExpense() {
    if (!eventId || !addForm.title.trim()) {
      Alert.alert("Required", "Enter expense title")
      return
    }
    setSaving(true)
    try {
      const { expense } = await budgetApi.createExpense(eventId, {
        title: addForm.title.trim(),
        totalAmount: addForm.totalAmount || "0",
        categoryId: addForm.categoryId || undefined,
        notes: addForm.notes || undefined,
      })
      setExpenses(e => [expense, ...e])
      setAddForm({ title: "", totalAmount: "", categoryId: "", notes: "" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteExpense(id: string) {
    if (!eventId) return
    Alert.alert("Delete expense?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await budgetApi.deleteExpense(eventId, id)
            setExpenses(e => e.filter(x => x.id !== id))
          } catch (e) {
            Alert.alert("Error", (e as Error).message)
          }
        },
      },
    ])
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>Create an event first to track its budget</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Track wedding expenses</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <EventPicker events={events} activeId={eventId} onSelect={setActiveEventId} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Total Budget</Text>
          <Text style={styles.overviewAmount}>{fmt(totalBudget)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.overviewRow}>
            <View>
              <Text style={styles.overviewSub}>Estimated</Text>
              <Text style={styles.overviewSubAmt}>{fmt(totalEstimated)}</Text>
            </View>
            <View>
              <Text style={styles.overviewSub}>Paid</Text>
              <Text style={styles.overviewSubAmt}>{fmt(totalPaid)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.overviewSub}>Remaining</Text>
              <Text style={[styles.overviewSubAmt, { color: totalBudget - totalEstimated >= 0 ? "#10b981" : "#ef4444" }]}>
                {fmt(totalBudget - totalEstimated)}
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#C9A96E" />
        ) : expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💰</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap + Add to track your first expense</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Expenses ({expenses.length})</Text>
            {expenses.map(exp => (
              <TouchableOpacity
                key={exp.id}
                style={styles.expenseCard}
                onLongPress={() => deleteExpense(exp.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{exp.title}</Text>
                  {exp.category && <Text style={styles.expenseCat}>{exp.category.name}</Text>}
                  {exp.notes && <Text style={styles.expenseNotes}>{exp.notes}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.expenseAmt}>{fmt(parseFloat(exp.totalAmount || "0"))}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[exp.status] ?? "#6b7280") + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[exp.status] ?? "#6b7280" }]}>
                      {exp.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={addForm.title}
            onChangeText={v => setAddForm(f => ({ ...f, title: v }))}
            placeholder="e.g. Photographer"
            placeholderTextColor="#B8A898"
          />
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={addForm.totalAmount}
            onChangeText={v => setAddForm(f => ({ ...f, totalAmount: v }))}
            placeholder="50000"
            placeholderTextColor="#B8A898"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={addForm.notes}
            onChangeText={v => setAddForm(f => ({ ...f, notes: v }))}
            placeholder="Optional notes"
            placeholderTextColor="#B8A898"
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={addExpense} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Expense</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 20, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#3D2B1F" },
  subtitle: { fontSize: 14, color: "#8B7355", marginTop: 2 },
  addBtn: { backgroundColor: "#C9A96E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  pickerScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  pickerChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#EDE0D4",
  },
  pickerChipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  pickerText: { fontSize: 13, color: "#8B7355", fontWeight: "500" },
  pickerTextActive: { color: "#fff", fontWeight: "600" },
  overviewCard: {
    margin: 16, backgroundColor: "#fff", borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: "#EDE0D4",
  },
  overviewLabel: { fontSize: 13, color: "#8B7355" },
  overviewAmount: { fontSize: 36, fontWeight: "700", color: "#3D2B1F", marginTop: 4 },
  progressTrack: {
    height: 8, backgroundColor: "#f7e7ce", borderRadius: 4,
    marginVertical: 12, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#C9A96E", borderRadius: 4 },
  overviewRow: { flexDirection: "row", justifyContent: "space-between" },
  overviewSub: { fontSize: 12, color: "#8B7355" },
  overviewSubAmt: { fontSize: 15, fontWeight: "600", color: "#3D2B1F", marginTop: 2 },
  sectionLabel: {
    fontSize: 13, fontWeight: "600", color: "#8B7355",
    textTransform: "uppercase", letterSpacing: 1,
    marginHorizontal: 16, marginTop: 8, marginBottom: 8,
  },
  expenseCard: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff",
    marginHorizontal: 16, marginBottom: 8, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "#EDE0D4",
  },
  expenseTitle: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  expenseCat: { fontSize: 12, color: "#C9A96E", marginTop: 2 },
  expenseNotes: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  expenseAmt: { fontSize: 16, fontWeight: "700", color: "#3D2B1F" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 32, flex: 1 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#8B7355", textAlign: "center", lineHeight: 20 },
  modalContainer: { flex: 1, backgroundColor: "#FDF8F5", padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#3D2B1F" },
  modalClose: { color: "#C9A96E", fontSize: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#EDE0D4", borderRadius: 10,
    padding: 14, fontSize: 15, color: "#3D2B1F", backgroundColor: "#fff",
  },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
