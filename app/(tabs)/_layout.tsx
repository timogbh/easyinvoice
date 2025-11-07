import { Tabs, Redirect, useRouter } from "expo-router";
import { Home, Users, Package, Settings, FileText, Sparkles, BarChart3 } from "lucide-react-native";
import React from "react";
import { useUserStore } from "@/state/userStore";

export default function TabLayout() {
  const profile = useUserStore((state) => state.profile);
  const isPremium = profile?.premium || false;
  const router = useRouter();

  if (!profile || !profile.consentISO) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0F766E",
        tabBarInactiveTintColor: "#6B7280",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#F9FAFB",
        },
        headerTintColor: "#111827",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clients",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: "Items",
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: "AI Assistant",
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          href: isPremium ? "/(tabs)/analytics" : null,
        }}
        listeners={{
          tabPress: (event) => {
            if (!isPremium) {
              event.preventDefault();
              router.push("/paywall" as never);
            }
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
