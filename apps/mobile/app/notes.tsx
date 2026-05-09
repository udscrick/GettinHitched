import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { Stack } from "expo-router"
import { notesApi, Note } from "../lib/api"

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", content: "", category: "general" })

  useEffect(() => {
    notesApi.list().then(({ notes: n }) => setNotes(n)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addNote() {
    if (!form.content.trim()) {
      Alert.alert("Required", "Enter note content")
      return
    }
    setSaving(true)
    try {
      const { note } = await notesApi.create({
        title: form.title.trim() || undefined,
        content: form.content.trim(),
        category: form.category,
      })
      setNotes(n => [note, ...n])
      setForm({ title: "", content: "", category: "general" })
      setShowAdd(false)
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function togglePin(note: Note) {
    try {
      await notesApi.pin(note.id, !note.isPinned)
      setNotes(n => n.map(x => x.id === note.id ? { ...x, isPinned: !x.isPinned } : x)
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)))
    } catch (e) {
      Alert.alert("Error", (e as Error).message)
    }
  }

  async function deleteNote(id: string) {
    Alert.alert("Delete note?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await notesApi.delete(id)
            setNotes(n => n.filter(x => x.id !== id))
          } catch (e) {
            Alert.alert("Error", (e as Error).message)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Notes" }} />
      <View style={styles.topBar}>
        <Text style={styles.count}>{notes.length} note{notes.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C9A96E" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {notes.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptySubtitle}>Jot down ideas, reminders, or vendor notes</Text>
            </View>
          ) : (
            notes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={[styles.card, note.isPinned && styles.cardPinned]}
                onLongPress={() => Alert.alert(note.title || "Note", "", [
                  { text: note.isPinned ? "Unpin" : "Pin", onPress: () => togglePin(note) },
                  { text: "Delete", style: "destructive", onPress: () => deleteNote(note.id) },
                  { text: "Cancel", style: "cancel" },
                ])}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  {note.title && <Text style={styles.cardTitle}>{note.title}</Text>}
                  {note.isPinned && <Text style={{ fontSize: 14 }}>📌</Text>}
                </View>
                <Text style={styles.cardContent} numberOfLines={4}>{note.content}</Text>
                <Text style={styles.cardCategory}>{note.category}</Text>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Note</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={v => setForm(f => ({ ...f, title: v }))}
            placeholder="Note title"
            placeholderTextColor="#B8A898"
          />
          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, { height: 120 }]}
            value={form.content}
            onChangeText={v => setForm(f => ({ ...f, content: v }))}
            placeholder="Write your note..."
            placeholderTextColor="#B8A898"
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={addNote} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Note</Text>}
          </TouchableOpacity>
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
  cardPinned: { borderColor: "#C9A96E", backgroundColor: "#fffbf5" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#3D2B1F", marginBottom: 4, flex: 1 },
  cardContent: { fontSize: 14, color: "#5C4033", lineHeight: 20 },
  cardCategory: { fontSize: 11, color: "#B8A898", marginTop: 8, textTransform: "uppercase" },
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
  saveBtn: { backgroundColor: "#C9A96E", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
