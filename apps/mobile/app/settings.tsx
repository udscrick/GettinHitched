import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { Stack } from "expo-router"
import { useApp } from "../contexts/AppContext"
import { weddingApi } from "../lib/api"

export default function SettingsScreen() {
  const { wedding, setWedding, signOut } = useApp()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    partnerOneName: wedding?.partnerOneName ?? "",
    partnerTwoName: wedding?.partnerTwoName ?? "",
    weddingDate: wedding?.weddingDate
      ? new Date(wedding.weddingDate).toISOString().split("T")[0]
      : "",
    city: wedding?.city ?? "",
    state: wedding?.state ?? "",
    story: wedding?.story ?? "",
  })

  async function saveSettings() {
    setSaving(true)
    try {
      const { wedding: updated } = await weddingApi.update({
        partnerOneName: form.partnerOneName || undefined,
        partnerTwoName: form.partnerTwoName || undefined,
        weddingDate: form.weddingDate || null,
        city: form.city || null,
        state: form.state || null,
        story: form.story || null,
      })
      setWedding(updated)
      Alert.alert("Saved", "Wedding details updated")
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string; multiline?: boolean }> = [
    { key: "partnerOneName", label: "Partner 1 Name", placeholder: "Priya" },
    { key: "partnerTwoName", label: "Partner 2 Name", placeholder: "Arjun" },
    { key: "weddingDate", label: "Wedding Date (YYYY-MM-DD)", placeholder: "2025-12-15" },
    { key: "city", label: "City", placeholder: "Mumbai" },
    { key: "state", label: "State", placeholder: "Maharashtra" },
    { key: "story", label: "Your Story", placeholder: "How you met...", multiline: true },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Wedding Details</Text>
        <View style={styles.card}>
          {fields.map(field => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, field.multiline && { height: 100 }]}
                value={form[field.key]}
                onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                placeholder={field.placeholder}
                placeholderTextColor="#B8A898"
                multiline={field.multiline}
                autoCapitalize={field.key === "weddingDate" ? "none" : "words"}
                keyboardType={field.key === "weddingDate" ? "numbers-and-punctuation" : "default"}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        {wedding && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Wedding Info</Text>
            <View style={styles.card}>
              <InfoRow label="Wedding ID" value={wedding.id.slice(-8)} />
              <InfoRow label="Public Slug" value={wedding.slug} />
              <InfoRow label="Website" value={wedding.websiteEnabled ? "Enabled" : "Disabled"} />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, styles.signOutBtn]}
          onPress={() => {
            Alert.alert("Sign out?", "You'll need to sign in again.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: signOut },
            ])
          }}
        >
          <Text style={[styles.saveBtnText, { color: "#ef4444" }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5EDE3" }}>
      <Text style={{ color: "#8B7355", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: "#3D2B1F", fontSize: 13, fontWeight: "500" }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  content: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#EDE0D4", marginBottom: 16 },
  fieldGroup: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#EDE0D4", borderRadius: 10, padding: 12, fontSize: 15, color: "#3D2B1F", backgroundColor: "#FDF8F5" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 8 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  signOutBtn: { backgroundColor: "#fee2e2" },
})
