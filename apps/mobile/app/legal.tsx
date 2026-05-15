import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput, Switch,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { legalApi, LegalChecklist } from "../lib/api"

const PRENUP_STATUSES = ["NOT_NEEDED", "CONSIDERING", "IN_PROGRESS", "SIGNED"]

export default function LegalScreen() {
  const [checklist, setChecklist] = useState<LegalChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    licenseState: "",
    licenseObtained: false,
    licenseDate: "",
    waitingPeriodDays: "",
    licenseExpiryDate: "",
    prenupStatus: "NOT_NEEDED",
    prenupNotes: "",
    nameChangeItems: "",
    notes: "",
  })

  useEffect(() => {
    legalApi.get()
      .then(({ checklist: c }) => {
        if (c) {
          setChecklist(c)
          const nameItems = (() => {
            try { return (JSON.parse(c.nameChangeItems ?? "[]") as string[]).join("\n") }
            catch { return c.nameChangeItems ?? "" }
          })()
          setForm({
            licenseState: c.licenseState ?? "",
            licenseObtained: c.licenseObtained,
            licenseDate: c.licenseDate?.slice(0, 10) ?? "",
            waitingPeriodDays: c.waitingPeriodDays?.toString() ?? "",
            licenseExpiryDate: c.licenseExpiryDate?.slice(0, 10) ?? "",
            prenupStatus: c.prenupStatus ?? "NOT_NEEDED",
            prenupNotes: c.prenupNotes ?? "",
            nameChangeItems: nameItems,
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
      const nameItems = form.nameChangeItems.trim()
        ? JSON.stringify(form.nameChangeItems.split("\n").map(s => s.trim()).filter(Boolean))
        : null
      const { checklist: updated } = await legalApi.update({
        licenseState: form.licenseState || null,
        licenseObtained: form.licenseObtained,
        licenseDate: form.licenseDate || null,
        waitingPeriodDays: form.waitingPeriodDays ? parseInt(form.waitingPeriodDays) : null,
        licenseExpiryDate: form.licenseExpiryDate || null,
        prenupStatus: form.prenupStatus,
        prenupNotes: form.prenupNotes || null,
        nameChangeItems: nameItems,
        notes: form.notes || null,
      })
      setChecklist(updated)
      setShowEdit(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const nameItems = (() => {
    try { return JSON.parse(checklist?.nameChangeItems ?? "[]") as string[] }
    catch { return [] }
  })()

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Legal & Documents" }} />
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Legal Checklist</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Marriage License</Text>
          <View style={styles.card}>
            <InfoRow label="State / Region" value={checklist?.licenseState} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>License Obtained</Text>
              <Text style={[styles.rowValue, { color: checklist?.licenseObtained ? "#10b981" : "#ef4444" }]}>
                {checklist?.licenseObtained ? "Yes ✓" : "No"}
              </Text>
            </View>
            <InfoRow label="License Date" value={checklist?.licenseDate?.slice(0, 10)} />
            <InfoRow label="Waiting Period" value={checklist?.waitingPeriodDays != null ? `${checklist.waitingPeriodDays} days` : undefined} />
            <InfoRow label="Expiry Date" value={checklist?.licenseExpiryDate?.slice(0, 10)} />
          </View>

          <Text style={styles.sectionLabel}>Prenuptial Agreement</Text>
          <View style={styles.card}>
            <InfoRow label="Status" value={checklist?.prenupStatus?.replace(/_/g, " ")} />
            {checklist?.prenupNotes && <InfoRow label="Notes" value={checklist.prenupNotes} />}
          </View>

          {nameItems.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Name Change Items</Text>
              <View style={styles.card}>
                {nameItems.map((item, i) => (
                  <View key={i} style={[styles.row, i === nameItems.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.nameItem}>• {item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {checklist?.notes && (
            <>
              <Text style={styles.sectionLabel}>Notes</Text>
              <View style={styles.card}>
                <Text style={styles.notesText}>{checklist.notes}</Text>
              </View>
            </>
          )}

          {!checklist?.licenseState && !checklist?.licenseDate && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⚖️</Text>
              <Text style={styles.emptyTitle}>No legal details yet</Text>
              <Text style={styles.emptySubtitle}>Track your marriage license and legal requirements</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Legal Details</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>State / Region</Text>
            <TextInput style={styles.input} value={form.licenseState} onChangeText={v => setForm(f => ({ ...f, licenseState: v }))} placeholder="Maharashtra, California..." placeholderTextColor="#B8A898" />

            <View style={styles.switchRow}>
              <Text style={styles.label}>License Obtained</Text>
              <Switch
                value={form.licenseObtained}
                onValueChange={v => setForm(f => ({ ...f, licenseObtained: v }))}
                trackColor={{ true: "#C9A96E" }}
              />
            </View>

            <Text style={styles.label}>License Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={form.licenseDate} onChangeText={v => setForm(f => ({ ...f, licenseDate: v }))} placeholder="2025-11-01" placeholderTextColor="#B8A898" />

            <Text style={styles.label}>Waiting Period (days)</Text>
            <TextInput style={styles.input} value={form.waitingPeriodDays} onChangeText={v => setForm(f => ({ ...f, waitingPeriodDays: v }))} placeholder="3" placeholderTextColor="#B8A898" keyboardType="numeric" />

            <Text style={styles.label}>License Expiry Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={form.licenseExpiryDate} onChangeText={v => setForm(f => ({ ...f, licenseExpiryDate: v }))} placeholder="2026-01-01" placeholderTextColor="#B8A898" />

            <Text style={styles.label}>Prenup Status</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PRENUP_STATUSES.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, form.prenupStatus === s && styles.chipActive]} onPress={() => setForm(f => ({ ...f, prenupStatus: s }))}>
                  <Text style={[styles.chipText, form.prenupStatus === s && { color: "#fff" }]}>{s.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Prenup Notes</Text>
            <TextInput style={styles.input} value={form.prenupNotes} onChangeText={v => setForm(f => ({ ...f, prenupNotes: v }))} placeholder="Lawyer, signing date..." placeholderTextColor="#B8A898" />

            <Text style={styles.label}>Name Change Items (one per line)</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={form.nameChangeItems}
              onChangeText={v => setForm(f => ({ ...f, nameChangeItems: v }))}
              placeholder={"Passport\nDriving licence\nBank accounts"}
              placeholderTextColor="#B8A898"
              multiline
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={form.notes}
              onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              placeholder="Any additional notes..."
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
  nameItem: { fontSize: 13, color: "#3D2B1F" },
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
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: "#EDE0D4" },
  chipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  chipText: { fontSize: 12, color: "#8B7355", fontWeight: "500" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
