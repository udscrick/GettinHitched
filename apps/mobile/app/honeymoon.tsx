import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { honeymoonApi, HoneymoonPlan, HoneymoonDestination, PackingItem } from "../lib/api"

const PACKING_FOR = ["PARTNER_1", "PARTNER_2", "BOTH"]

export default function HoneymoonScreen() {
  const [plan, setPlan] = useState<HoneymoonPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"destinations" | "packing">("destinations")
  const [showAddDest, setShowAddDest] = useState(false)
  const [showAddPack, setShowAddPack] = useState(false)
  const [saving, setSaving] = useState(false)
  const [destForm, setDestForm] = useState({ name: "", country: "", accommodation: "", estimatedCost: "", notes: "" })
  const [packForm, setPackForm] = useState({ name: "", category: "", quantity: "1", forWho: "BOTH" })

  useEffect(() => {
    honeymoonApi.get().then(({ plan: p }) => setPlan(p)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addDestination() {
    if (!destForm.name.trim()) { Alert.alert("Required", "Enter destination name"); return }
    setSaving(true)
    try {
      const { destination } = await honeymoonApi.addDestination({
        name: destForm.name.trim(),
        country: destForm.country || undefined,
        accommodation: destForm.accommodation || undefined,
        estimatedCost: destForm.estimatedCost || undefined,
        notes: destForm.notes || undefined,
      })
      setPlan(p => p ? { ...p, destinations: [...p.destinations, destination] } : p)
      setDestForm({ name: "", country: "", accommodation: "", estimatedCost: "", notes: "" })
      setShowAddDest(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function addPackingItem() {
    if (!packForm.name.trim()) { Alert.alert("Required", "Enter item name"); return }
    setSaving(true)
    try {
      const { item } = await honeymoonApi.addPackingItem({
        name: packForm.name.trim(),
        category: packForm.category || undefined,
        quantity: parseInt(packForm.quantity) || 1,
        forWho: packForm.forWho,
      })
      setPlan(p => p ? { ...p, packingItems: [...p.packingItems, item] } : p)
      setPackForm({ name: "", category: "", quantity: "1", forWho: "BOTH" })
      setShowAddPack(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function togglePacked(item: PackingItem) {
    try {
      await honeymoonApi.addPackingItem({ ...item, isPacked: !item.isPacked })
      setPlan(p => p ? { ...p, packingItems: p.packingItems.map(x => x.id === item.id ? { ...x, isPacked: !x.isPacked } : x) } : p)
    } catch {}
  }

  async function deleteDestination(id: string) {
    Alert.alert("Delete destination?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await honeymoonApi.delete(id)
            setPlan(p => p ? { ...p, destinations: p.destinations.filter(d => d.id !== id) } : p)
          } catch (e) { Alert.alert("Error", (e as Error).message) }
        },
      },
    ])
  }

  const destinations = plan?.destinations ?? []
  const packingItems = plan?.packingItems ?? []

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Honeymoon" }} />
      {plan && (
        <View style={styles.planBar}>
          {plan.departureDate && <Text style={styles.planText}>Departs: {plan.departureDate.slice(0, 10)}</Text>}
          {plan.returnDate && <Text style={styles.planText}>Returns: {plan.returnDate.slice(0, 10)}</Text>}
          {plan.budget && <Text style={styles.planBudget}>Budget: ₹{plan.budget}</Text>}
        </View>
      )}

      <View style={styles.tabs}>
        {(["destinations", "packing"] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "destinations" ? `Destinations (${destinations.length})` : `Packing (${packingItems.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : tab === "destinations" ? (
        <>
          <View style={styles.topBar}>
            <Text style={styles.count}>{destinations.length} destination{destinations.length !== 1 ? "s" : ""}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddDest(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {destinations.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>✈️</Text>
                <Text style={styles.emptyTitle}>No destinations yet</Text>
                <Text style={styles.emptySubtitle}>Add your honeymoon destinations</Text>
              </View>
            ) : (
              destinations.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.card}
                  onLongPress={() => Alert.alert(d.name, "", [
                    { text: "Delete", style: "destructive", onPress: () => deleteDestination(d.id) },
                    { text: "Cancel", style: "cancel" },
                  ])}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{d.name}</Text>
                    {d.country && <Text style={styles.cardSub}>{d.country}</Text>}
                    {d.accommodation && <Text style={styles.cardSub}>Stay: {d.accommodation}</Text>}
                    {d.estimatedCost && <Text style={styles.cardPrice}>Est. ₹{d.estimatedCost}</Text>}
                  </View>
                  {d.isBooked && <View style={styles.bookedBadge}><Text style={styles.bookedText}>Booked</Text></View>}
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.topBar}>
            <Text style={styles.count}>{packingItems.filter(i => i.isPacked).length}/{packingItems.length} packed</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddPack(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {packingItems.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🧳</Text>
                <Text style={styles.emptyTitle}>Packing list empty</Text>
                <Text style={styles.emptySubtitle}>Add items to pack for your honeymoon</Text>
              </View>
            ) : (
              packingItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.packCard} onPress={() => togglePacked(item)}>
                  <View style={[styles.checkbox, item.isPacked && styles.checkboxDone]}>
                    {item.isPacked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.packName, item.isPacked && styles.packNameDone]}>{item.name}</Text>
                    {item.category && <Text style={styles.packSub}>{item.category} · {item.forWho.replace(/_/g, " ")}</Text>}
                  </View>
                  {item.quantity > 1 && <Text style={styles.qty}>×{item.quantity}</Text>}
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
        </>
      )}

      <Modal visible={showAddDest} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Destination</Text>
            <TouchableOpacity onPress={() => setShowAddDest(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <Text style={styles.label}>Destination *</Text>
          <TextInput style={styles.input} value={destForm.name} onChangeText={v => setDestForm(f => ({ ...f, name: v }))} placeholder="Bali, Maldives, Paris..." placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Country</Text>
          <TextInput style={styles.input} value={destForm.country} onChangeText={v => setDestForm(f => ({ ...f, country: v }))} placeholder="Indonesia" placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Accommodation</Text>
          <TextInput style={styles.input} value={destForm.accommodation} onChangeText={v => setDestForm(f => ({ ...f, accommodation: v }))} placeholder="Resort / Hotel name" placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Estimated Cost (₹)</Text>
          <TextInput style={styles.input} value={destForm.estimatedCost} onChangeText={v => setDestForm(f => ({ ...f, estimatedCost: v }))} placeholder="150000" placeholderTextColor="#B8A898" keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={addDestination} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Destination</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showAddPack} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Packing Item</Text>
            <TouchableOpacity onPress={() => setShowAddPack(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput style={styles.input} value={packForm.name} onChangeText={v => setPackForm(f => ({ ...f, name: v }))} placeholder="Sunscreen, Passport, Dress..." placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Category</Text>
          <TextInput style={styles.input} value={packForm.category} onChangeText={v => setPackForm(f => ({ ...f, category: v }))} placeholder="Clothes, Documents, Toiletries..." placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={packForm.quantity} onChangeText={v => setPackForm(f => ({ ...f, quantity: v }))} placeholder="1" placeholderTextColor="#B8A898" keyboardType="numeric" />
          <Text style={styles.label}>For</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PACKING_FOR.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, packForm.forWho === p && styles.chipActive]} onPress={() => setPackForm(f => ({ ...f, forWho: p }))}>
                <Text style={[styles.chipText, packForm.forWho === p && { color: "#fff" }]}>{p.replace(/_/g, " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={addPackingItem} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Item</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  planBar: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#EDE0D4" },
  planText: { fontSize: 12, color: "#8B7355" },
  planBudget: { fontSize: 12, color: "#C9A96E", fontWeight: "600" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: "#EDE0D4" },
  tabActive: { backgroundColor: "#C9A96E" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#8B7355" },
  tabTextActive: { color: "#fff" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  count: { fontSize: 13, color: "#8B7355" },
  addBtn: { backgroundColor: "#C9A96E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4", flexDirection: "row", alignItems: "center" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#3D2B1F" },
  cardSub: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: "600", color: "#C9A96E", marginTop: 4 },
  bookedBadge: { backgroundColor: "#d1fae5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  bookedText: { fontSize: 11, color: "#10b981", fontWeight: "600" },
  packCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4", gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#EDE0D4", alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: "#10b981", borderColor: "#10b981" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  packName: { fontSize: 14, fontWeight: "600", color: "#3D2B1F" },
  packNameDone: { color: "#B8A898", textDecorationLine: "line-through" },
  packSub: { fontSize: 11, color: "#8B7355", marginTop: 2 },
  qty: { fontSize: 13, color: "#8B7355", fontWeight: "600" },
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
  chip: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "#EDE0D4", backgroundColor: "#fff" },
  chipActive: { backgroundColor: "#C9A96E", borderColor: "#C9A96E" },
  chipText: { fontSize: 12, color: "#8B7355", fontWeight: "600" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
