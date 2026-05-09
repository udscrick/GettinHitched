import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback } from "react"
import { useApp } from "../../contexts/AppContext"
import { guestsApi, Guest, WeddingEvent } from "../../lib/api"

const RSVP_COLORS: Record<string, string> = {
  CONFIRMED: "#10b981",
  DECLINED: "#ef4444",
  PENDING: "#f59e0b",
}
const RSVP_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  PENDING: "Pending",
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
          <Text style={[styles.pickerText, e.id === activeId && styles.pickerTextActive]}>
            {e.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

export default function GuestsScreen() {
  const { events, activeEventId, setActiveEventId } = useApp()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [saving, setSaving] = useState(false)

  const eventId = activeEventId

  const fetchGuests = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { guests: data } = await guestsApi.list(eventId)
      setGuests(data)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchGuests() }, [fetchGuests])

  async function addGuest() {
    if (!eventId || !addForm.firstName.trim() || !addForm.lastName.trim()) {
      Alert.alert("Required", "Enter first and last name")
      return
    }
    setSaving(true)
    try {
      const { guest } = await guestsApi.create(eventId, {
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: addForm.email.trim() || undefined,
        phone: addForm.phone.trim() || undefined,
      })
      setGuests(g => [guest, ...g])
      setAddForm({ firstName: "", lastName: "", email: "", phone: "" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function updateRSVP(guest: Guest, status: string) {
    if (!eventId) return
    try {
      const { guest: updated } = await guestsApi.update(eventId, guest.id, { rsvpStatus: status })
      setGuests(g => g.map(x => x.id === guest.id ? updated : x))
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    }
  }

  async function deleteGuest(id: string) {
    if (!eventId) return
    Alert.alert("Delete guest?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await guestsApi.delete(eventId, id)
            setGuests(g => g.filter(x => x.id !== id))
          } catch (e) {
            Alert.alert("Error", (e as Error).message)
          }
        },
      },
    ])
  }

  const filtered = guests.filter(g =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const confirmed = guests.filter(g => g.rsvpStatus === "CONFIRMED").length
  const declined = guests.filter(g => g.rsvpStatus === "DECLINED").length
  const pending = guests.filter(g => g.rsvpStatus === "PENDING").length

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>Create an event first, then manage guests for it</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Guests</Text>
          <Text style={styles.subtitle}>Manage guest list and RSVPs</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <EventPicker events={events} activeId={eventId} onSelect={setActiveEventId} />

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{guests.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#d1fae5" }]}>
          <Text style={[styles.statNum, { color: "#10b981" }]}>{confirmed}</Text>
          <Text style={styles.statLbl}>Confirmed</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#fee2e2" }]}>
          <Text style={[styles.statNum, { color: "#ef4444" }]}>{declined}</Text>
          <Text style={styles.statLbl}>Declined</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: "#fef3c7" }]}>
          <Text style={[styles.statNum, { color: "#f59e0b" }]}>{pending}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search guests..."
        placeholderTextColor="#B8A898"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>{guests.length === 0 ? "No guests yet" : "No matches"}</Text>
          <Text style={styles.emptySubtitle}>
            {guests.length === 0 ? "Tap + Add to add your first guest" : "Try a different search"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={g => g.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item: guest }) => (
            <View style={styles.guestCard}>
              <View style={styles.guestInfo}>
                <Text style={styles.guestName}>{guest.firstName} {guest.lastName}</Text>
                {guest.email && <Text style={styles.guestContact}>{guest.email}</Text>}
                {guest.dietaryRestriction && (
                  <Text style={styles.guestDiet}>🍽 {guest.dietaryRestriction}</Text>
                )}
              </View>
              <View style={styles.guestActions}>
                <View style={[styles.rsvpBadge, { backgroundColor: (RSVP_COLORS[guest.rsvpStatus] ?? "#6b7280") + "20" }]}>
                  <Text style={[styles.rsvpText, { color: RSVP_COLORS[guest.rsvpStatus] ?? "#6b7280" }]}>
                    {RSVP_LABELS[guest.rsvpStatus] ?? guest.rsvpStatus}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Update RSVP", `${guest.firstName} ${guest.lastName}`, [
                      { text: "Confirmed ✓", onPress: () => updateRSVP(guest, "CONFIRMED") },
                      { text: "Declined ✗", onPress: () => updateRSVP(guest, "DECLINED") },
                      { text: "Pending", onPress: () => updateRSVP(guest, "PENDING") },
                      { text: "Delete Guest", style: "destructive", onPress: () => deleteGuest(guest.id) },
                      { text: "Cancel", style: "cancel" },
                    ])
                  }}
                >
                  <Text style={styles.moreBtn}>•••</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Guest</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {(["firstName", "lastName", "email", "phone"] as const).map(field => (
            <View key={field}>
              <Text style={styles.label}>{field === "firstName" ? "First Name *" : field === "lastName" ? "Last Name *" : field === "email" ? "Email" : "Phone"}</Text>
              <TextInput
                style={styles.input}
                value={addForm[field]}
                onChangeText={v => setAddForm(f => ({ ...f, [field]: v }))}
                placeholder={field === "firstName" ? "Jane" : field === "lastName" ? "Smith" : field === "email" ? "jane@example.com" : "+1 555 0000"}
                placeholderTextColor="#B8A898"
                keyboardType={field === "email" ? "email-address" : field === "phone" ? "phone-pad" : "default"}
                autoCapitalize={field === "email" || field === "phone" ? "none" : "words"}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={addGuest} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Guest</Text>}
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
  statsRow: { flexDirection: "row", paddingHorizontal: 12, gap: 6, marginBottom: 10 },
  statChip: { flex: 1, backgroundColor: "#f7e7ce", borderRadius: 10, padding: 8, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "700", color: "#C9A96E" },
  statLbl: { fontSize: 10, color: "#8B7355", marginTop: 1 },
  search: {
    marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4",
    borderRadius: 10, padding: 12, fontSize: 14, color: "#3D2B1F", backgroundColor: "#fff",
  },
  guestCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4",
  },
  guestInfo: { flex: 1 },
  guestName: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  guestContact: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  guestDiet: { fontSize: 11, color: "#8B7355", marginTop: 2 },
  guestActions: { alignItems: "flex-end", gap: 6 },
  rsvpBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rsvpText: { fontSize: 11, fontWeight: "600" },
  moreBtn: { color: "#C9A96E", fontSize: 18, paddingHorizontal: 4 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
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
