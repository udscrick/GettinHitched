import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, Switch,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { websiteApi, WebsiteSettings, WebsiteSection } from "../lib/api"
import { useApp } from "../contexts/AppContext"

const THEMES = ["IVORY", "BLUSH", "SAGE", "NAVY"]
const THEME_COLORS: Record<string, string> = {
  IVORY: "#FDF8F5",
  BLUSH: "#FADADD",
  SAGE: "#B2C9B2",
  NAVY: "#1E3A5F",
}

export default function WebsiteScreen() {
  const { wedding } = useApp()
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [sections, setSections] = useState<WebsiteSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    websiteEnabled: false,
    websiteTheme: "IVORY",
    websiteTitle: "",
    websiteMessage: "",
  })

  useEffect(() => {
    websiteApi.get()
      .then(({ website: w, sections: s }) => {
        if (w) {
          setSettings(w)
          setForm({
            websiteEnabled: w.websiteEnabled,
            websiteTheme: w.websiteTheme,
            websiteTitle: w.websiteTitle ?? "",
            websiteMessage: w.websiteMessage ?? "",
          })
        }
        setSections(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { website: updated } = await websiteApi.update({
        websiteEnabled: form.websiteEnabled,
        websiteTheme: form.websiteTheme,
        websiteTitle: form.websiteTitle || null,
        websiteMessage: form.websiteMessage || null,
      })
      setSettings(updated)
      Alert.alert("Saved", "Website settings updated")
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const slug = settings?.slug ?? wedding?.slug

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Wedding Website" }} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Website Status</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Website Enabled</Text>
                {slug && <Text style={styles.slugText}>/w/{slug}</Text>}
              </View>
              <Switch
                value={form.websiteEnabled}
                onValueChange={v => setForm(f => ({ ...f, websiteEnabled: v }))}
                trackColor={{ true: "#C9A96E" }}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Theme</Text>
          <View style={styles.themeRow}>
            {THEMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.themeChip,
                  { backgroundColor: THEME_COLORS[t] },
                  form.websiteTheme === t && styles.themeChipActive,
                ]}
                onPress={() => setForm(f => ({ ...f, websiteTheme: t }))}
              >
                <Text style={[styles.themeText, t === "NAVY" && { color: "#fff" }]}>{t}</Text>
                {form.websiteTheme === t && <Text style={[styles.themeCheck, t === "NAVY" && { color: "#fff" }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Content</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={form.websiteTitle}
              onChangeText={v => setForm(f => ({ ...f, websiteTitle: v }))}
              placeholder="Priya & Arjun's Wedding"
              placeholderTextColor="#B8A898"
            />
            <Text style={styles.label}>Welcome Message</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={form.websiteMessage}
              onChangeText={v => setForm(f => ({ ...f, websiteMessage: v }))}
              placeholder="We are so glad you can join us..."
              placeholderTextColor="#B8A898"
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
          </TouchableOpacity>

          {sections.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Page Sections</Text>
              <View style={styles.card}>
                {sections.map((s, i) => (
                  <View key={s.id} style={[styles.sectionRow, i === sections.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.sectionName}>{s.title ?? s.type.replace(/_/g, " ")}</Text>
                    <View style={[styles.visibleBadge, s.isVisible && styles.visibleBadgeActive]}>
                      <Text style={[styles.visibleText, s.isVisible && { color: "#10b981" }]}>
                        {s.isVisible ? "Visible" : "Hidden"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.hintText}>Manage sections in detail from the web app</Text>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  content: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#8B7355", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#EDE0D4" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 15, fontWeight: "600", color: "#3D2B1F" },
  slugText: { fontSize: 12, color: "#C9A96E", marginTop: 2 },
  themeRow: { flexDirection: "row", gap: 8 },
  themeChip: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  themeChipActive: { borderColor: "#C9A96E" },
  themeText: { fontSize: 11, fontWeight: "600", color: "#3D2B1F" },
  themeCheck: { fontSize: 14, fontWeight: "700", color: "#C9A96E", marginTop: 2 },
  label: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#EDE0D4", borderRadius: 10, padding: 12, fontSize: 15, color: "#3D2B1F", backgroundColor: "#FDF8F5" },
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5EDE3" },
  sectionName: { fontSize: 13, color: "#3D2B1F", flex: 1 },
  visibleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#F5EDE3" },
  visibleBadgeActive: { backgroundColor: "#d1fae5" },
  visibleText: { fontSize: 11, fontWeight: "600", color: "#8B7355" },
  hintText: { fontSize: 12, color: "#B8A898", textAlign: "center", marginTop: 8 },
})
