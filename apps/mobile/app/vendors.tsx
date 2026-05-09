import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback } from "react"
import { Stack } from "expo-router"
import { useApp } from "../contexts/AppContext"
import { vendorsApi, Vendor, WeddingEvent } from "../lib/api"

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "#10b981",
  CONTRACT_SIGNED: "#3b82f6",
  RESEARCHING: "#f59e0b",
  REJECTED: "#ef4444",
}

const VENDOR_TYPES = ["PHOTOGRAPHER", "VIDEOGRAPHER", "CATERER", "FLORIST", "DJ", "BAND", "CAKE", "MAKEUP", "HAIR", "VENUE", "DECOR", "TRANSPORT", "OTHER"]

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

export default function VendorsScreen() {
  const { events, activeEventId, setActiveEventId } = useApp()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", type: "PHOTOGRAPHER", email: "", phone: "", price: "", notes: "" })

  const eventId = activeEventId

  const fetch = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const { vendors: data } = await vendorsApi.list(eventId)
      setVendors(data)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetch() }, [fetch])

  async function addVendor() {
    if (!eventId || !form.name.trim()) {
      Alert.alert("Required", "Enter vendor name")
      return
    }
    setSaving(true)
    try {
      const { vendor } = await vendorsApi.create(eventId, {
        name: form.name.trim(),
        type: form.type,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        price: form.price || undefined,
        notes: form.notes || undefined,
      })
      setVendors(v => [vendor, ...v])
      setForm({ name: "", type: "PHOTOGRAPHER", email: "", phone: "", price: "", notes: "" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(vendor: Vendor, status: string) {
    if (!eventId) return
    try {
      const { vendor: updated } = await vendorsApi.update(eventId, vendor.id, { status })
      setVendors(v => v.map(x => x.id === vendor.id ? updated : x))
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Vendors" }} />
      <View style={styles.topBar}>
        <Text style={styles.count}>{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</Text>
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
          {vendors.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛍️</Text>
              <Text style={styles.emptyTitle}>No vendors yet</Text>
              <Text style={styles.emptySubtitle}>Add vendors to track quotes and bookings</Text>
            </View>
          ) : (
            vendors.map(v => (
              <View key={v.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{v.name}</Text>
                  <Text style={styles.cardType}>{v.type.replace(/_/g, " ")}</Text>
                  {v.email && <Text style={styles.cardContact}>{v.email}</Text>}
                  {v.price && <Text style={styles.cardPrice}>₹{v.price}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Update Status", v.name, [
                    { text: "Researching", onPress: () => updateStatus(v, "RESEARCHING") },
                    { text: "Booked", onPress: () => updateStatus(v, "BOOKED") },
                    { text: "Contract Signed", onPress: () => updateStatus(v, "CONTRACT_SIGNED") },
                    { text: "Cancel", style: "cancel" },
                  ])}
                >
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[v.status] ?? "#6b7280") + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[v.status] ?? "#6b7280" }]}>
                      {v.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Vendor</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {(["name", "email", "phone", "price", "notes"] as const).map(field => (
              <View key={field}>
                <Text style={styles.label}>
                  {field === "name" ? "Name *" : field === "price" ? "Price (₹)" : field.charAt(0).toUpperCase() + field.slice(1)}
                </Text>
                <TextInput
                  style={[styles.input, field === "notes" && { height: 80 }]}
                  value={form[field]}
                  onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                  placeholder={field === "name" ? "Vendor name" : field === "email" ? "email@example.com" : ""}
                  placeholderTextColor="#B8A898"
                  keyboardType={field === "phone" ? "phone-pad" : "default"}
                  multiline={field === "notes"}
                  autoCapitalize={field === "email" ? "none" : "words"}
                />
              </View>
            ))}
            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {VENDOR_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Text style={[styles.typeChipText, form.type === t && { color: "#fff" }]}>
                    {t.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={addVendor} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Vendor</Text>}
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
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  cardName: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  cardType: { fontSize: 12, color: "#C9A96E", marginTop: 2 },
  cardContact: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
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
  typeChip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  typeChipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  typeChipText: { fontSize: 12, color: "#8B7355", fontWeight: "500" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
