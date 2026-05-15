import "../global.css"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AppProvider } from "../contexts/AppContext"

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="vendors" options={{ title: "Vendors", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="venues" options={{ title: "Venues", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="ceremony" options={{ title: "Ceremony", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="reception" options={{ title: "Reception", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="wedding-party" options={{ title: "Wedding Party", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="honeymoon" options={{ title: "Honeymoon", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="engagement" options={{ title: "Engagement", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="invitations" options={{ title: "Invitations", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="registry" options={{ title: "Gift Registry", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="notes" options={{ title: "Notes", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="legal" options={{ title: "Legal & Documents", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="website" options={{ title: "Wedding Website", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="reports" options={{ title: "Reports", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
          <Stack.Screen name="settings" options={{ title: "Settings", headerStyle: { backgroundColor: "#FDF8F5" }, headerTintColor: "#3D2B1F" }} />
        </Stack>
      </SafeAreaProvider>
    </AppProvider>
  )
}
