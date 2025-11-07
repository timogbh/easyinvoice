import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUserStore } from "@/state/userStore";
import { useDataStore } from "@/state/dataStore";
import { usePlanStore } from "@/state/planStore";
import { initRevenueCat, getEntitlements } from "@/services/revenuecat";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          presentation: "modal",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="invoice-editor"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="quote-editor"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: "modal",
          title: "Upgrade to Premium",
        }}
      />
      <Stack.Screen
        name="legal"
        options={{
          presentation: "modal",
          title: "Legal Information",
        }}
      />
      <Stack.Screen
        name="account-data"
        options={{
          presentation: "modal",
          title: "Account Data",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const loadUserCache = useUserStore((state) => state.loadFromCache);
  const loadDataCache = useDataStore((state) => state.loadFromCache);
  const loadPlanCache = usePlanStore((state) => state.loadFromCache);
  const ensureCurrentPeriod = usePlanStore((state) => state.ensureCurrentPeriod);
  const setPremium = useUserStore((state) => state.setPremium);
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    async function initialize() {
      try {
        await Promise.all([
          loadUserCache(),
          loadDataCache(),
          loadPlanCache(),
          initRevenueCat(),
        ]);
        ensureCurrentPeriod();
        
        // Sync premium status from RevenueCat
        if (profile) {
          const entitlements = await getEntitlements();
          if (entitlements.premium !== profile.premium) {
            await setPremium(entitlements.premium);
          }
        }
      } catch (error) {
        console.error("[RootLayout] Initialization error:", error);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    initialize();
  }, [loadUserCache, loadDataCache, loadPlanCache, ensureCurrentPeriod, setPremium, profile]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
