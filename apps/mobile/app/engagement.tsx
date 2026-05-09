import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { engagementApi, EngagementDetail } from "../lib/api"

export default function EngagementScreen() {
  const [detail, setDetail] = useState<EngagementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    proposalDate: "",
    proposalLocation: "",
    proposalStory: "",
    ringDescription: "",
    whoProposed: "",
    engagementPartyDate: "",
    engagementPartyVenue: "",
    engagementPartyNotes: "",
    notes: "",
  })

  useEffect(() => {
    engagementApi.get()
      .then(({ detail: d }) => {
        if (d) {
          setDetail(d)
          setForm({
            proposalDate: d.proposalDate?.slice(0, 10) ?? "",
            proposalLocation: d.proposalLocation ?? "",
            proposalStory: d.proposalStory ?? "",
            ringDescription: d.ringDescription ?? "",
            whoProposed: d.whoProposed ?? "",
            engagementPartyDate: d.engagementPartyDate?.slice(0, 10) ?? "",
            engagementPartyVenue: d.engagementPartyVenue ?? "",
            engagementPartyNotes: d.engagementPartyNotes ?? "",
            notes: d.notes ?? "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { detail: updated } = await engagementApi.update({
        proposalDate: form.proposalDate || null,
        proposalLocation: form.proposalLocation || null,
        proposalStory: form.proposalStory || null,
        ringDescription: form.ringDescription || null,
        whoProposed: form.whoProposed || null,
        engagementPartyDate: form.engagementPartyDate || null,
        engagementPartyVenue: form.engagementPartyVenue || null,
        engagementPartyNotes: form.engagementPartyNotes || null,
        notes: form.notes || null,
      })
      setDetail(updated)
      setShowEdit(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Engagement" }} />
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Engagement</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Proposal</Text>
          <View style={styles.card}>
            <InfoRow label="Date" value={detail?.proposalDate?.slice(0, 10)} />
            <InfoRow label="Location" value={detail?.proposalLocation} />
            <InfoRow label="Who Proposed" value={detail?.whoProposed} />
            <InfoRow label="Ring" value={detail?.ringDescription} />
          </View>

          {detail?.proposalStory ? (
            <>
              <Text style={styles.sectionLabel}>The Story</Text>
              <View style={styles.card}>
                <Text style={styles.storyText}>{detail.proposalStory}</Text>
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Engagement Party</Text>
          <View style={styles.card}>
            <InfoRow label="Date" value={detail?.engagementPartyDate?.slice(0, 10)} />
            <InfoRow label="Venue" value={detail?.engagementPartyVenue} />
          </View>
          {detail?.engagementPartyNotes ? (
            <View style={[styles.card, { marginTop: 8 }]}>
              <Text style={styles.storyText}>{detail.engagementPartyNotes}</Text>
            </View>
          ) : null}

          {!detail?.proposalDate && !detail?.proposalLocation && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💍</Text>
              <Text style={styles.emptyTitle}>No engagement details yet</Text>
              <Text style={styles.emptySubtitle}>Tap Edit to record your proposal story</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Engagement</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {([
              { key: "whoProposed", label: "Who Proposed", placeholder: "Partner 1's name", multi: false },
              { key: "proposalDate", label: "Proposal Date (YYYY-MM-DD)", placeholder: "2024-02-14", multi: false },
              { key: "proposalLocation", label: "Proposal Location", placeholder: "Eiffel Tower, beach...", multi: false },
              { key: "ringDescription", label: "Ring Description", placeholder: "Solitaire, emerald cut...", multi: false },
              { key: "proposalStory", label: "The Story", placeholder: "How it happened...", multi: true },
              { key: "engagementPartyDate", label: "Party Date (YYYY-MM-DD)", placeholder: "2024-03-01", multi: false },
              { key: "engagementPartyVenue", label: "Party Venue", placeholder: "Restaurant / Home", multi: false },
              { key: "engagementPartyNotes", label: "Party Notes", placeholder: "Guest list, theme...", multi: true },
              { key: "notes", label: "Other Notes", placeholder: "Any other details...", multi: true },
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
  storyText: { fontSize: 14, color: "#5C4033", lineHeight: 22, paddingVertical: 12 },
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
