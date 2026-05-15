import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { ceremonyApi, CeremonyDetail } from "../lib/api"

const OFFICIANT_TYPES = ["RELIGIOUS", "CIVIL", "FRIEND_FAMILY", "SELF_OFFICIATED", "OTHER"]

export default function CeremonyScreen() {
  const [ceremony, setCeremony] = useState<CeremonyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    officiantName: "",
    officiantType: "RELIGIOUS",
    location: "",
    startTime: "",
    endTime: "",
    notes: "",
  })

  useEffect(() => {
    ceremonyApi.get()
      .then(({ ceremony: c }) => {
        if (c) {
          setCeremony(c)
          setForm({
            officiantName: c.officiantName ?? "",
            officiantType: c.officiantType ?? "RELIGIOUS",
            location: c.location ?? "",
            startTime: c.startTime ?? "",
            endTime: c.endTime ?? "",
            notes: c.notes ?? "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { ceremony: updated } = await ceremonyApi.update({
        officiantName: form.officiantName || null,
        officiantType: form.officiantType || null,
        location: form.location || null,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        notes: form.notes || null,
      })
      setCeremony(updated)
      setShowEdit(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Ceremony" }} />
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Ceremony Details</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <InfoRow label="Location" value={ceremony?.location} />
            <InfoRow label="Start Time" value={ceremony?.startTime} />
            <InfoRow label="End Time" value={ceremony?.endTime} />
            <InfoRow label="Officiant" value={ceremony?.officiantName} />
            <InfoRow label="Officiant Type" value={ceremony?.officiantType?.replace(/_/g, " ")} />
          </View>
          {ceremony?.notes ? (
            <>
              <Text style={styles.sectionLabel}>Notes</Text>
              <View style={styles.card}>
                <Text style={styles.notesText}>{ceremony.notes}</Text>
              </View>
            </>
          ) : null}
          {!ceremony?.location && !ceremony?.officiantName && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⛪</Text>
              <Text style={styles.emptyTitle}>No ceremony details yet</Text>
              <Text style={styles.emptySubtitle}>Tap Edit to add your ceremony information</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Ceremony</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Location</Text>
            <TextInput style={styles.input} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} placeholder="Church, temple, garden..." placeholderTextColor="#B8A898" />
            <Text style={styles.label}>Start Time</Text>
            <TextInput style={styles.input} value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))} placeholder="e.g. 10:00 AM" placeholderTextColor="#B8A898" />
            <Text style={styles.label}>End Time</Text>
            <TextInput style={styles.input} value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))} placeholder="e.g. 11:30 AM" placeholderTextColor="#B8A898" />
            <Text style={styles.label}>Officiant Name</Text>
            <TextInput style={styles.input} value={form.officiantName} onChangeText={v => setForm(f => ({ ...f, officiantName: v }))} placeholder="Pandit / Priest / Friend" placeholderTextColor="#B8A898" />
            <Text style={styles.label}>Officiant Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {OFFICIANT_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, form.officiantType === t && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, officiantType: t }))}
                >
                  <Text style={[styles.chipText, form.officiantType === t && { color: "#fff" }]}>{t.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={form.notes}
              onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              placeholder="Additional details..."
              placeholderTextColor="#B8A898"
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F" },
  editBtn: { backgroundColor: "#C9A96E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  editBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  content: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: "#EDE0D4" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5EDE3" },
  rowLabel: { fontSize: 13, color: "#8B7355", flex: 1 },
  rowValue: { fontSize: 13, color: "#3D2B1F", fontWeight: "500", flex: 2, textAlign: "right" },
  notesText: { fontSize: 14, color: "#5C4033", lineHeight: 22, paddingVertical: 12 },
  empty: { alignItems: "center", justifyContent: "center", padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#8B7355", textAlign: "center" },
  modal: { flex: 1, backgroundColor: "#FDF8F5", padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#3D2B1F" },
  modalClose: { color: "#C9A96E", fontSize: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#EDE0D4", borderRadius: 10, padding: 14, fontSize: 15, color: "#3D2B1F", backgroundColor: "#fff" },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  chipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  chipText: { fontSize: 12, color: "#8B7355", fontWeight: "500" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
