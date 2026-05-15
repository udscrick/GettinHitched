import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { weddingPartyApi, WeddingPartyMember } from "../lib/api"

const ROLES = ["MAID_OF_HONOR", "BEST_MAN", "BRIDESMAID", "GROOMSMAN", "FLOWER_GIRL", "RING_BEARER", "USHER", "OTHER"]
const SIDES = ["PARTNER_1", "PARTNER_2", "BOTH"]

export default function WeddingPartyScreen() {
  const [members, setMembers] = useState<WeddingPartyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", role: "BRIDESMAID", side: "PARTNER_1", email: "", phone: "", duties: "" })

  useEffect(() => {
    weddingPartyApi.list().then(({ members: m }) => setMembers(m)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addMember() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Enter member name")
      return
    }
    setSaving(true)
    try {
      const { member } = await weddingPartyApi.create({
        name: form.name.trim(),
        role: form.role,
        side: form.side,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        duties: form.duties || undefined,
      })
      setMembers(m => [...m, member])
      setForm({ name: "", role: "BRIDESMAID", side: "PARTNER_1", email: "", phone: "", duties: "" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleOutfit(member: WeddingPartyMember, field: "outfitOrdered" | "outfitPickedUp") {
    try {
      const updated = await weddingPartyApi.update(member.id, { [field]: !member[field] })
      setMembers(m => m.map(x => x.id === member.id ? updated.member : x))
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Wedding Party" }} />
      <View style={styles.topBar}>
        <Text style={styles.count}>{members.length} member{members.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {members.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💎</Text>
              <Text style={styles.emptyTitle}>No party members yet</Text>
              <Text style={styles.emptySubtitle}>Add your bridal party and groomsmen</Text>
            </View>
          ) : (
            members.map(m => (
              <View key={m.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{m.name}</Text>
                  <Text style={styles.cardRole}>{m.role.replace(/_/g, " ")} · {m.side?.replace(/_/g, " ") ?? ""}</Text>
                  {m.email && <Text style={styles.cardSub}>{m.email}</Text>}
                  {m.duties && <Text style={styles.cardSub}>{m.duties}</Text>}
                </View>
                <View style={styles.outfitStatus}>
                  <TouchableOpacity
                    style={[styles.outfitBadge, m.outfitOrdered && styles.outfitBadgeActive]}
                    onPress={() => toggleOutfit(m, "outfitOrdered")}
                  >
                    <Text style={[styles.outfitText, m.outfitOrdered && { color: "#fff" }]}>Ordered</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.outfitBadge, m.outfitPickedUp && styles.outfitBadgeActive]}
                    onPress={() => toggleOutfit(m, "outfitPickedUp")}
                  >
                    <Text style={[styles.outfitText, m.outfitPickedUp && { color: "#fff" }]}>Picked Up</Text>
                  </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Add Member</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Member name"
              placeholderTextColor="#B8A898"
              autoCapitalize="words"
            />
            <Text style={styles.label}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, form.role === r && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, role: r }))}
                >
                  <Text style={[styles.chipText, form.role === r && { color: "#fff" }]}>{r.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Side</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {SIDES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.side === s && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, side: s }))}
                >
                  <Text style={[styles.chipText, form.side === s && { color: "#fff" }]}>{s.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={v => setForm(f => ({ ...f, email: v }))}
              placeholder="email@example.com"
              placeholderTextColor="#B8A898"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={v => setForm(f => ({ ...f, phone: v }))}
              placeholder="+91 9999 9999"
              placeholderTextColor="#B8A898"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Duties</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={form.duties}
              onChangeText={v => setForm(f => ({ ...f, duties: v }))}
              placeholder="Responsibilities..."
              placeholderTextColor="#B8A898"
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={addMember} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Member</Text>}
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
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#3D2B1F" },
  cardRole: { fontSize: 12, color: "#C9A96E", marginTop: 2 },
  cardSub: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  outfitStatus: { flexDirection: "row", gap: 6, marginTop: 10 },
  outfitBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#EDE0D4" },
  outfitBadgeActive: { backgroundColor: "#10b981", borderColor: "#10b981" },
  outfitText: { fontSize: 11, color: "#8B7355", fontWeight: "600" },
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
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  chipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  chipText: { fontSize: 12, color: "#8B7355", fontWeight: "500" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
