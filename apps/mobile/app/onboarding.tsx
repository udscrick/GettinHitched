import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { useApp } from "../contexts/AppContext"
import { weddingApi } from "../lib/api"

export default function OnboardingScreen() {
  const { setWedding } = useApp()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    partnerOneName: "",
    partnerTwoName: "",
    weddingDate: "",
    city: "",
    state: "",
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function finish() {
    if (!form.partnerOneName.trim() || !form.partnerTwoName.trim()) {
      Alert.alert("Required", "Enter both partner names")
      return
    }
    setLoading(true)
    try {
      const { wedding } = await weddingApi.create({
        partnerOneName: form.partnerOneName.trim(),
        partnerTwoName: form.partnerTwoName.trim(),
        weddingDate: form.weddingDate || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      })
      setWedding(wedding)
      router.replace("/(tabs)/")
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: "Welcome! 💍",
      subtitle: "Let's set up your wedding",
      content: (
        <View>
          <Text style={styles.welcomeText}>
            GettinHitched helps you plan every detail of your big day. Let's start with the basics.
          </Text>
        </View>
      ),
    },
    {
      title: "Partner Names",
      subtitle: "Who's getting married?",
      content: (
        <View style={styles.fields}>
          <Text style={styles.label}>Partner 1 Name</Text>
          <TextInput
            style={styles.input}
            value={form.partnerOneName}
            onChangeText={v => update("partnerOneName", v)}
            placeholder="e.g. Priya"
            placeholderTextColor="#B8A898"
            autoCapitalize="words"
          />
          <Text style={styles.label}>Partner 2 Name</Text>
          <TextInput
            style={styles.input}
            value={form.partnerTwoName}
            onChangeText={v => update("partnerTwoName", v)}
            placeholder="e.g. Arjun"
            placeholderTextColor="#B8A898"
            autoCapitalize="words"
          />
        </View>
      ),
    },
    {
      title: "Wedding Details",
      subtitle: "Optional — you can add these later",
      content: (
        <View style={styles.fields}>
          <Text style={styles.label}>Wedding Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.weddingDate}
            onChangeText={v => update("weddingDate", v)}
            placeholder="2025-12-15"
            placeholderTextColor="#B8A898"
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={v => update("city", v)}
            placeholder="Mumbai"
            placeholderTextColor="#B8A898"
            autoCapitalize="words"
          />
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={form.state}
            onChangeText={v => update("state", v)}
            placeholder="Maharashtra"
            placeholderTextColor="#B8A898"
            autoCapitalize="words"
          />
        </View>
      ),
    },
  ]

  const isLast = step === steps.length - 1

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i <= step && styles.dotActive]}
            />
          ))}
        </View>

        <Text style={styles.stepTitle}>{steps[step].title}</Text>
        <Text style={styles.stepSub}>{steps[step].subtitle}</Text>

        <View style={styles.stepContent}>{steps[step].content}</View>

        <View style={styles.actions}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}

          {isLast ? (
            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={finish} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>Start Planning!</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep(s => s + 1)}>
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  progress: { flexDirection: "row", gap: 8, marginBottom: 32 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: "#EDE0D4" },
  dotActive: { backgroundColor: "#C9A96E" },
  stepTitle: { fontSize: 26, fontWeight: "700", color: "#3D2B1F", marginBottom: 6 },
  stepSub: { fontSize: 14, color: "#8B7355", marginBottom: 32 },
  stepContent: { flex: 1, minHeight: 160 },
  welcomeText: { fontSize: 16, color: "#5C4033", lineHeight: 24 },
  fields: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#3D2B1F", marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#EDE0D4",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#3D2B1F",
    backgroundColor: "#fff",
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 40 },
  backBtn: {
    borderWidth: 1,
    borderColor: "#EDE0D4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 0.4,
  },
  backText: { color: "#8B7355", fontWeight: "600", fontSize: 15 },
  nextBtn: {
    backgroundColor: "#C9A96E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
