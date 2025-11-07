import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "@/state/userStore";
import { useDataStore } from "@/state/dataStore";
import { usePlanStore } from "@/state/planStore";
import { ButtonPrimary } from "@/components/ButtonPrimary";
import { logEvent, AnalyticsEvents } from "@/services/analytics";
import * as Clipboard from "expo-clipboard";

export default function AccountDataScreen() {
  const profile = useUserStore((state) => state.profile);
  const clients = useDataStore((state) => state.clients);
  const items = useDataStore((state) => state.items);
  const documents = useDataStore((state) => state.documents);
  const counters = usePlanStore((state) => state.counters);

  const [copied, setCopied] = useState(false);

  const exportData = () => {
    const data = {
      profile,
      clients,
      items,
      documents,
      counters,
      exportedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data, null, 2);

    Clipboard.setStringAsync(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      logEvent(AnalyticsEvents.DATA_EXPORT);
      Alert.alert("Success", "Data copied to clipboard. You can paste it into a text file.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Account Data</Text>
        <Text style={styles.subtitle}>
          Export all your data in JSON format for backup or transfer purposes.
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Profile:</Text>
            <Text style={styles.statValue}>{profile ? "1 record" : "None"}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Clients:</Text>
            <Text style={styles.statValue}>{clients.length} records</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Items:</Text>
            <Text style={styles.statValue}>{items.length} records</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Documents:</Text>
            <Text style={styles.statValue}>{documents.length} records</Text>
          </View>
        </View>

        <ButtonPrimary
          title={copied ? "Copied!" : "Copy Data to Clipboard"}
          onPress={exportData}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>GDPR Data Export</Text>
          <Text style={styles.infoText}>
            This export contains all personal data stored in the app, including your company profile, client information, items, and documents.
          </Text>
          <Text style={styles.infoText}>
            The data is provided in JSON format. You can save this to a file for your records or to import into another system.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    lineHeight: 24,
  },
  statsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: "#374151",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E40AF",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
    marginBottom: 8,
  },
});
