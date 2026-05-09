import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback } from "react"
import { Stack } from "expo-router"
import { useApp } from "../contexts/AppContext"
import { venuesApi, Venue, WeddingEvent } from "../lib/api"

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "#10b981",
  RESEARCHING: "#f59e0b",
  VISITED: "#3b82f6",
  REJECTED: "#ef4444",
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

export default function VenuesScreen() {
  const { events, activeEventId, setActiveEventId } = useApp()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", address: "", city: "", capacity: "", notes: "", pros: "", cons: "" })

  const eventId = activeEventId

  const fetch = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { venues: data } = await venuesApi.list(eventId)
      setVenues(data)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetch() }, [fetch])

  async function addVenue() {
    if (!eventId || !form.name.trim()) {
      Alert.alert("Required", "Enter venue name")
      return
    }
    setSaving(true)
    try {
      const { venue } = await venuesApi.create(eventId, {
        name: form.name.trim(),
        address: form.address || undefined,
        city: form.city || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        notes: form.notes || undefined,
        pros: form.pros || undefined,
        cons: form.cons || undefined,
      })
      setVenues(v => [venue, ...v])
      setForm({ name: "", address: "", city: "", capacity: "", notes: "", pros: "", cons: "" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Venues" }} />
      <View style={styles.topBar}>
        <Text style={styles.count}>{venues.length} venue{venues.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {events.length > 0 && (
        <EventPicker events={events} activeId={eventId} onSelect={setActiveEventId} />
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {venues.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏛️</Text>
              <Text style={styles.emptyTitle}>No venues yet</Text>
              <Text style={styles.emptySubtitle}>Add venues to compare and track your research</Text>
            </View>
          ) : (
            venues.map(v => (
              <View key={v.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{v.name}</Text>
                  {v.city && <Text style={styles.cardSub}>{v.city}</Text>}
                  {v.capacity && <Text style={styles.cardSub}>Capacity: {v.capacity}</Text>}
                  {v.pros && <Text style={styles.cardPros}>✓ {v.pros}</Text>}
                  {v.cons && <Text style={styles.cardCons}>✗ {v.cons}</Text>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[v.status] ?? "#6b7280") + "20" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[v.status] ?? "#6b7280" }]}>
                    {v.status.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Venue</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {(["name", "address", "city", "capacity", "pros", "cons", "notes"] as const).map(field => (
              <View key={field}>
                <Text style={styles.label}>
                  {field === "name" ? "Venue Name *" : field.charAt(0).toUpperCase() + field.slice(1)}
                </Text>
                <TextInput
                  style={[styles.input, ["notes", "pros", "cons"].includes(field) && { height: 72 }]}
                  value={form[field]}
                  onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                  placeholder={field === "capacity" ? "e.g. 200" : ""}
                  placeholderTextColor="#B8A898"
                  keyboardType={field === "capacity" ? "numeric" : "default"}
                  multiline={["notes", "pros", "cons"].includes(field)}
                  autoCapitalize="words"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={addVenue} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Venue</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  count: { fontSize: 14, color: "#8B7355" },
  addBtn: { backgroundColor: "#C9A96E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  pickerScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  pickerChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  pickerChipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  pickerText: { fontSize: 13, color: "#8B7355", fontWeight: "500" },
  pickerTextActive: { color: "#fff", fontWeight: "600" },
  list: { paddingHorizontal: 16 },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#3D2B1F" },
  cardSub: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  cardPros: { fontSize: 12, color: "#10b981", marginTop: 4 },
  cardCons: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#8B7355", textAlign: "center" },
  modal: { flex: 1, backgroundColor: "#FDF8F5", padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#3D2B1F" },
  modalClose: { color: "#C9A96E", fontSize: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#EDE0D4", borderRadius: 10, padding: 14, fontSize: 15, color: "#3D2B1F", backgroundColor: "#fff" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
