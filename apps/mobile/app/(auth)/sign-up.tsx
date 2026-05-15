import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native"
import { useState } from "react"
import { Link, useRouter } from "expo-router"
import { useApp } from "../../contexts/AppContext"

export default function SignUpScreen() {
  const { signUp } = useApp()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Fill in all fields")
      return
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      await signUp(name.trim(), email.trim().toLowerCase(), password)
      router.replace("/onboarding")
    } catch (e) {
      setLoading(false)
      Alert.alert("Sign up failed", (e as Error).message)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>💍</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start planning your perfect wedding</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            placeholder="Jane Smith"
            placeholderTextColor="#B8A898"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor="#B8A898"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Min 8 characters"
            placeholderTextColor="#B8A898"
          />

          <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" style={styles.footerLink}>Sign In</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#3D2B1F" },
  subtitle: { fontSize: 15, color: "#8B7355", marginTop: 6 },
  form: { gap: 4 },
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
  btn: {
    backgroundColor: "#C9A96E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#8B7355", fontSize: 14 },
  footerLink: { color: "#C9A96E", fontWeight: "600", fontSize: 14 },
})
