import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TemplateId, TemplateMeta } from "@/types";
import TemplateCard from "@/components/TemplateCard";
import { useUserStore } from "@/state/userStore";

const TEMPLATE_METADATA: TemplateMeta[] = [
  {
    id: "modern",
    name: "Modern",
    supportsLogo: true,
    supportsBrandColor: true,
    pageSize: "A4",
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  },
  {
    id: "classic",
    name: "Classic",
    supportsLogo: true,
    supportsBrandColor: true,
    pageSize: "A4",
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
  },
  {
    id: "minimal",
    name: "Minimal",
    supportsLogo: true,
    supportsBrandColor: true,
    pageSize: "A4",
    margins: { top: 30, right: 30, bottom: 30, left: 30 },
  },
];

export default function Templates() {
  const router = useRouter();
  const params = useLocalSearchParams<{ currentTemplate?: TemplateId }>();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const premium = profile?.premium || false;

  const [selected, setSelected] = useState<TemplateId>(
    (params.currentTemplate as TemplateId) || profile?.defaultTemplate || "modern"
  );

  console.log("[Templates] Current template:", selected, "Premium:", premium);

  const handleSelect = (templateId: TemplateId) => {
    console.log("[Templates] Selecting template:", templateId);

    const isPremiumTemplate = templateId !== "modern";
    if (isPremiumTemplate && !premium) {
      Alert.alert(
        "Premium erforderlich",
        "Dieses Template ist nur für Premium-Nutzer verfügbar.",
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => router.push("/paywall"),
          },
        ]
      );
      return;
    }

    setSelected(templateId);
  };

  const handleSave = async () => {
    console.log("[Templates] Saving selection:", selected);
    await setProfile({ defaultTemplate: selected });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Template wählen",
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>PDF Template auswählen</Text>
          <Text style={styles.subtitle}>
            Wähle das Design für deine Rechnungen und Angebote
          </Text>
        </View>

        <View style={styles.grid}>
          {TEMPLATE_METADATA.map((meta) => {
            const isPremiumRequired = meta.id !== "modern";
            return (
              <View key={meta.id} style={styles.gridItem}>
                <TemplateCard
                  meta={meta}
                  selected={selected === meta.id}
                  premiumRequired={isPremiumRequired}
                  isPremium={premium}
                  logoUrl={profile?.logoUrl}
                  brandColor={profile?.brandColor}
                  onPress={() => handleSelect(meta.id)}
                />
              </View>
            );
          })}
        </View>

        {!premium && (
          <View style={styles.premiumHint}>
            <Text style={styles.premiumHintTitle}>
              🎨 Weitere Templates mit Premium
            </Text>
            <Text style={styles.premiumHintText}>
              Schalte Classic und Minimal Templates frei, nutze dein Logo und
              deine Brandfarbe.
            </Text>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => router.push("/paywall")}
              activeOpacity={0.7}
            >
              <Text style={styles.premiumButtonText}>
                Premium freischalten
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Auswahl speichern</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  grid: {
    gap: 16,
  },
  gridItem: {
    width: "100%",
  },
  premiumHint: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  premiumHintTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#92400E",
    marginBottom: 8,
  },
  premiumHintText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
    marginBottom: 12,
  },
  premiumButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#374151",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
