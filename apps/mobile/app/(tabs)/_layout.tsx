import { Tabs, Redirect } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { LayoutDashboard, Users, DollarSign, CheckSquare, MoreHorizontal } from "lucide-react-native"
import { useApp } from "../../contexts/AppContext"

export default function TabLayout() {
  const { user, wedding, isLoading } = useApp()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FDF8F5" }}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    )
  }

  if (!user) return <Redirect href="/(auth)/sign-in" />
  if (!wedding) return <Redirect href="/onboarding" />

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C9A96E",
        tabBarInactiveTintColor: "#8B7355",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#EDE0D4" },
        headerStyle: { backgroundColor: "#FDF8F5" },
        headerTitleStyle: { color: "#3D2B1F", fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: "Guests",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
