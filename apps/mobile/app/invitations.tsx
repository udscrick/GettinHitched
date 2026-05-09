import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { invitationsApi, InvitationBatch } from "../lib/api"

const METHOD_COLORS: Record<string, string> = {
  EMAIL: "#3b82f6",
  PAPER: "#8b5cf6",
  BOTH: "#C9A96E",
}

const TYPE_LABELS: Record<string, string> = {
  SAVE_THE_DATE: "Save the Date",
  WEDDING_INVITE: "Wedding Invite",
  REHEARSAL: "Rehearsal",
  RECEPTION_ONLY: "Reception Only",
  OTHER: "Other",
}

export default function InvitationsScreen() {
  const [batches, setBatches] = useState<InvitationBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invitationsApi.list()
      .then(({ batches: b }) => setBatches(b))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sent = batches.filter(b => b.sentAt)

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Invitations" }} />
      <View style={styles.statsBar}>
        <StatBox label="Total Batches" value={batches.length} />
        <StatBox label="Sent" value={sent.length} />
        <StatBox label="Pending" value={batches.length - sent.length} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {batches.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💌</Text>
              <Text style={styles.emptyTitle}>No invitation batches yet</Text>
              <Text style={styles.emptySubtitle}>Create invitation batches from the web app</Text>
            </View>
          ) : (
            batches.map(batch => (
              <View key={batch.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{batch.name}</Text>
                  <Text style={styles.cardType}>{TYPE_LABELS[batch.type] ?? batch.type}</Text>
                  {batch.rsvpDeadline && (
                    <Text style={styles.cardDeadline}>RSVP by: {batch.rsvpDeadline.slice(0, 10)}</Text>
                  )}
                  {batch.notes && <Text style={styles.cardNotes}>{batch.notes}</Text>}
                </View>
                <View style={styles.rightCol}>
                  <View style={[styles.methodBadge, { backgroundColor: (METHOD_COLORS[batch.method] ?? "#6b7280") + "20" }]}>
                    <Text style={[styles.methodText, { color: METHOD_COLORS[batch.method] ?? "#6b7280" }]}>
                      {batch.method}
                    </Text>
                  </View>
                  {batch.sentAt ? (
                    <Text style={styles.sentText}>✓ Sent</Text>
                  ) : (
                    <Text style={styles.pendingText}>Pending</Text>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  statsBar: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#EDE0D4" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#C9A96E" },
  statLabel: { fontSize: 11, color: "#8B7355", marginTop: 2, textAlign: "center" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#EDE0D4" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#3D2B1F" },
  cardType: { fontSize: 12, color: "#C9A96E", marginTop: 2 },
  cardDeadline: { fontSize: 12, color: "#8B7355", marginTop: 4 },
  cardNotes: { fontSize: 12, color: "#8B7355", marginTop: 4, fontStyle: "italic" },
  rightCol: { alignItems: "flex-end", gap: 6 },
  methodBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  methodText: { fontSize: 11, fontWeight: "600" },
  sentText: { fontSize: 11, color: "#10b981", fontWeight: "600" },
  pendingText: { fontSize: 11, color: "#f59e0b", fontWeight: "600" },
  empty: { alignItems: "center", justifyContent: "center", padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#3D2B1F", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#8B7355", textAlign: "center" },
})
