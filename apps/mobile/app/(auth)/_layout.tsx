import { Stack } from "expo-router"
import { Redirect } from "expo-router"
import { useApp } from "../../contexts/AppContext"
import { View, ActivityIndicator } from "react-native"

export default function AuthLayout() {
  const { user, isLoading } = useApp()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FDF8F5" }}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    )
  }

  if (user) {
    return <Redirect href="/(tabs)/" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  )
}
