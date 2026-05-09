import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback } from "react"
import { useApp } from "../../contexts/AppContext"
import { tasksApi, Task, WeddingEvent } from "../../lib/api"

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
}

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

export default function TasksScreen() {
  const { events, activeEventId, setActiveEventId } = useApp()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({ title: "", priority: "MEDIUM", dueDate: "" })

  const eventId = activeEventId

  const fetchTasks = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { tasks: data } = await tasksApi.list(eventId)
      setTasks(data)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function toggleTask(task: Task) {
    if (!eventId) return
    const next = !task.isCompleted
    setTasks(t => t.map(x => x.id === task.id ? { ...x, isCompleted: next } : x))
    try {
      await tasksApi.update(eventId, task.id, { isCompleted: next })
    } catch (e) {
      setTasks(t => t.map(x => x.id === task.id ? { ...x, isCompleted: task.isCompleted } : x))
      Alert.alert("Error", (e as Error).message)
    }
  }

  async function addTask() {
    if (!eventId || !addForm.title.trim()) {
      Alert.alert("Required", "Enter task title")
      return
    }
    setSaving(true)
    try {
      const { task } = await tasksApi.create(eventId, {
        title: addForm.title.trim(),
        priority: addForm.priority,
        dueDate: addForm.dueDate || undefined,
      })
      setTasks(t => [task, ...t])
      setAddForm({ title: "", priority: "MEDIUM", dueDate: "" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTask(id: string) {
    if (!eventId) return
    Alert.alert("Delete task?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await tasksApi.delete(eventId, id)
            setTasks(t => t.filter(x => x.id !== id))
          } catch (e) {
            Alert.alert("Error", (e as Error).message)
          }
        },
      },
    ])
  }

  const done = tasks.filter(t => t.isCompleted).length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>Create an event first to manage tasks for it</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Checklist</Text>
          <Text style={styles.subtitle}>Stay on track with planning</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Task</Text>
        </TouchableOpacity>
      </View>

      <EventPicker events={events} activeId={eventId} onSelect={setActiveEventId} />

      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{done} of {total} tasks complete</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#C9A96E" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tasks.length === 0 ? (
            <View style={[styles.emptyState, { flex: 0, paddingTop: 40 }]}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySubtitle}>Tap + Task to add planning tasks</Text>
            </View>
          ) : (
            tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.isCompleted && styles.taskCardDone]}
                onPress={() => toggleTask(task)}
                onLongPress={() => deleteTask(task.id)}
              >
                <View style={[styles.checkbox, task.isCompleted && styles.checkboxDone]}>
                  {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, task.isCompleted && styles.taskTitleDone]}>
                    {task.title}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] ?? "#6b7280" }]} />
                    <Text style={styles.taskMeta}>{task.priority}</Text>
                    {task.dueDate && (
                      <Text style={styles.taskMeta}>
                        Due {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </Text>
                    )}
                    {task.category && <Text style={styles.taskMeta}>{task.category}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={addForm.title}
            onChangeText={v => setAddForm(f => ({ ...f, title: v }))}
            placeholder="e.g. Book photographer"
            placeholderTextColor="#B8A898"
          />
          <Text style={styles.label}>Priority</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["LOW", "MEDIUM", "HIGH"].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityBtn, addForm.priority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                onPress={() => setAddForm(f => ({ ...f, priority: p }))}
              >
                <Text style={[styles.priorityBtnText, addForm.priority === p && { color: "#fff" }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={addForm.dueDate}
            onChangeText={v => setAddForm(f => ({ ...f, dueDate: v }))}
            placeholder="2025-06-15"
            placeholderTextColor="#B8A898"
            keyboardType="numbers-and-punctuation"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={addTask} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Task</Text>}
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
  progressCard: {
    margin: 16, backgroundColor: "#fff", borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: "#EDE0D4",
  },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 14, color: "#3D2B1F" },
  progressPct: { fontSize: 14, fontWeight: "600", color: "#C9A96E" },
  progressTrack: { height: 8, backgroundColor: "#f7e7ce", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#C9A96E", borderRadius: 4 },
  taskCard: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff",
    borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4",
    gap: 12,
  },
  taskCardDone: { opacity: 0.6 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: "#C9A96E", alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: "#C9A96E" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  taskTitle: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  taskTitleDone: { textDecorationLine: "line-through", color: "#8B7355" },
  taskMeta: { fontSize: 11, color: "#8B7355" },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
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
  priorityBtn: {
    flex: 1, borderWidth: 1, borderColor: "#EDE0D4", borderRadius: 8,
    padding: 10, alignItems: "center", backgroundColor: "#fff",
  },
  priorityBtnText: { fontSize: 13, fontWeight: "600", color: "#3D2B1F" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
