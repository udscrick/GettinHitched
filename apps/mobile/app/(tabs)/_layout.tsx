import { Tabs } from "expo-router"
import { LayoutDashboard, Users, DollarSign, CheckSquare, MoreHorizontal } from "lucide-react-native"

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C9A96E",
        tabBarInactiveTintColor: "#8B7355",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#EDE0D4",
        },
        headerStyle: {
          backgroundColor: "#FDF8F5",
        },
        headerTitleStyle: {
          fontFamily: "serif",
          color: "#3D2B1F",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: "Guests",
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, size }) => (
            <DollarSign color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <CheckSquare color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <MoreHorizontal color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
