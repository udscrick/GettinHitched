import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { receptionApi, ReceptionDetail } from "../lib/api"

export default function ReceptionScreen() {
  const [reception, setReception] = useState<ReceptionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    location: "",
    startTime: "",
    firstDanceSong: "",
    menu: "",
    barDetails: "",
    notes: "",
  })

  useEffect(() => {
    receptionApi.get()
      .then(({ reception: r }) => {
        if (r) {
          setReception(r)
          setForm({
            location: r.location ?? "",
            startTime: r.startTime ?? "",
            firstDanceSong: r.firstDanceSong ?? "",
            menu: r.menu ?? "",
            barDetails: r.barDetails ?? "",
            notes: r.notes ?? "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { reception: updated } = await receptionApi.update({
        location: form.location || null,
        startTime: form.startTime || null,
        firstDanceSong: form.firstDanceSong || null,
        menu: form.menu || null,
        barDetails: form.barDetails || null,
        notes: form.notes || null,
      })
      setReception(updated)
      setShowEdit(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Reception" }} />
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Reception Details</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <InfoRow label="Location" value={reception?.location} />
            <InfoRow label="Start Time" value={reception?.startTime} />
            <InfoRow label="First Dance Song" value={reception?.firstDanceSong} />
          </View>
          {reception?.menu ? (
            <>
              <Text style={styles.sectionLabel}>Menu</Text>
              <View style={styles.card}>
                <Text style={styles.blockText}>{reception.menu}</Text>
              </View>
            </>
          ) : null}
          {reception?.barDetails ? (
            <>
              <Text style={styles.sectionLabel}>Bar & Drinks</Text>
              <View style={styles.card}>
                <Text style={styles.blockText}>{reception.barDetails}</Text>
              </View>
            </>
          ) : null}
          {reception?.notes ? (
            <>
              <Text style={styles.sectionLabel}>Notes</Text>
              <View style={styles.card}>
                <Text style={styles.blockText}>{reception.notes}</Text>
              </View>
            </>
          ) : null}
          {!reception?.location && !reception?.firstDanceSong && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>No reception details yet</Text>
              <Text style={styles.emptySubtitle}>Tap Edit to add reception information</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Reception</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {([
              { key: "location", label: "Location", placeholder: "Venue / Hall name", multi: false },
              { key: "startTime", label: "Start Time", placeholder: "e.g. 7:00 PM", multi: false },
              { key: "firstDanceSong", label: "First Dance Song", placeholder: "Artist — Song title", multi: false },
              { key: "menu", label: "Menu", placeholder: "Starters, mains, desserts...", multi: true },
              { key: "barDetails", label: "Bar & Drinks", placeholder: "Open bar, signature cocktails...", multi: true },
              { key: "notes", label: "Notes", placeholder: "Speeches, timeline notes...", multi: true },
            ] as Array<{ key: keyof typeof form; label: string; placeholder: string; multi: boolean }>).map(({ key, label, placeholder, multi }) => (
              <View key={key}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={[styles.input, multi && { height: 80 }]}
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor="#B8A898"
                  multiline={multi}
                />
              </View>
            ))}
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
  blockText: { fontSize: 14, color: "#5C4033", lineHeight: 22, paddingVertical: 12 },
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
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
