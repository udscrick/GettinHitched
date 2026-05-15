import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { registryApi, RegistryItem, GiftReceived } from "../lib/api"

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"]
const PRIORITY_COLORS: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" }

export default function RegistryScreen() {
  const [items, setItems] = useState<RegistryItem[]>([])
  const [gifts, setGifts] = useState<GiftReceived[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"registry" | "gifts">("registry")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", price: "", url: "", store: "", priority: "MEDIUM" })

  useEffect(() => {
    registryApi.get().then(({ items: i, gifts: g }) => { setItems(i); setGifts(g) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addItem() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Enter item name")
      return
    }
    setSaving(true)
    try {
      const { item } = await registryApi.createItem({
        name: form.name.trim(),
        price: form.price || undefined,
        url: form.url || undefined,
        store: form.store || undefined,
        priority: form.priority,
      })
      setItems(i => [...i, item])
      setForm({ name: "", price: "", url: "", store: "", priority: "MEDIUM" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const totalValue = items.reduce((s, i) => s + parseFloat(i.price ?? "0"), 0)
  const thankedCount = gifts.filter(g => g.thankYouSent).length

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Gift Registry" }} />
      <View style={styles.tabs}>
        {(["registry", "gifts"] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "registry" ? `Registry (${items.length})` : `Gifts (${gifts.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : tab === "registry" ? (
        <>
          <View style={styles.topBar}>
            <Text style={styles.count}>Est. value: ₹{new Intl.NumberFormat("en-IN").format(totalValue)}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyTitle}>Registry is empty</Text>
                <Text style={styles.emptySubtitle}>Add items guests can gift you</Text>
              </View>
            ) : (
              items.map(item => (
                <View key={item.id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.store && <Text style={styles.cardSub}>{item.store}</Text>}
                    {item.price && <Text style={styles.cardPrice}>₹{item.price}</Text>}
                    <Text style={styles.cardPurchased}>{item.purchased}/{item.quantity} purchased</Text>
                  </View>
                  <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
                </View>
              ))
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.giftStats}>
            <Text style={styles.giftStatText}>{gifts.length} gifts · {thankedCount} thank-yous sent</Text>
          </View>
          {gifts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💌</Text>
              <Text style={styles.emptyTitle}>No gifts logged yet</Text>
              <Text style={styles.emptySubtitle}>Track gifts received and thank-you notes</Text>
            </View>
          ) : (
            gifts.map(gift => (
              <View key={gift.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{gift.giverName}</Text>
                  {gift.description && <Text style={styles.cardSub}>{gift.description}</Text>}
                  {gift.value && <Text style={styles.cardPrice}>₹{gift.value}</Text>}
                </View>
                <TouchableOpacity
                  style={[styles.thankBadge, gift.thankYouSent && styles.thankBadgeActive]}
                  onPress={async () => {
                    try {
                      await registryApi.update(gift.id, { thankYouSent: !gift.thankYouSent } as Partial<RegistryItem>, "gift")
                      setGifts(g => g.map(x => x.id === gift.id ? { ...x, thankYouSent: !x.thankYouSent } : x))
                    } catch (e) {
                      Alert.alert("Error", (e as Error).message)
                    }
                  }}
                >
                  <Text style={[styles.thankText, gift.thankYouSent && { color: "#fff" }]}>
                    {gift.thankYouSent ? "✓ Thanked" : "Thank"}
                  </Text>
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
            <Text style={styles.modalTitle}>Add Registry Item</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. KitchenAid Mixer" placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Store</Text>
          <TextInput style={styles.input} value={form.store} onChangeText={v => setForm(f => ({ ...f, store: v }))} placeholder="Amazon, Crate & Barrel..." placeholderTextColor="#B8A898" />
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput style={styles.input} value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} placeholder="5000" placeholderTextColor="#B8A898" keyboardType="numeric" />
          <Text style={styles.label}>Priority</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, form.priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]} onPress={() => setForm(f => ({ ...f, priority: p }))}>
                <Text style={[styles.chipText, form.priority === p && { color: "#fff" }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={addItem} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Item</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  tabs: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: "#EDE0D4" },
  tabActive: { backgroundColor: "#C9A96E" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#8B7355" },
  tabTextActive: { color: "#fff" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  count: { fontSize: 13, color: "#8B7355" },
  addBtn: { backgroundColor: "#C9A96E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  giftStats: { paddingVertical: 8, marginBottom: 4 },
  giftStatText: { fontSize: 13, color: "#8B7355" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  cardName: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  cardSub: { fontSize: 12, color: "#8B7355", marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 4 },
  cardPurchased: { fontSize: 11, color: "#C9A96E", marginTop: 2 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  thankBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#10b981" },
  thankBadgeActive: { backgroundColor: "#10b981" },
  thankText: { fontSize: 12, fontWeight: "600", color: "#10b981" },
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
  chip: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "#EDE0D4", backgroundColor: "#fff" },
  chipText: { fontSize: 12, color: "#8B7355", fontWeight: "600" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
