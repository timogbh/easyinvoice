import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, Copy } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import { usePlanStore } from "@/state/planStore";
import { generateText } from "@/services/ai";
import { logEvent, AnalyticsEvents } from "@/services/analytics";
import type { AITextType, Language, ToneType } from "@/types";
import * as Clipboard from "expo-clipboard";

export default function AIAssistantScreen() {
  const profile = useUserStore((state) => state.profile);
  const aiSettings = useUserStore((state) => state.aiSettings);
  const aiCounters = usePlanStore((state) => state.aiCounters);
  const canUseAI = usePlanStore((state) => state.canUseAI);
  const incAI = usePlanStore((state) => state.incAI);

  const [textType, setTextType] = useState<AITextType>("item_title");
  const [language, setLanguage] = useState<Language>(aiSettings.language);
  const [tone, setTone] = useState<ToneType>(aiSettings.tone);
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!aiSettings.enabled) {
      logEvent(AnalyticsEvents.AI_DISABLED_WARNING);
      Alert.alert(
        "AI Disabled",
        "AI is disabled. Please enable it in Settings to use this feature.",
        [{ text: "OK" }]
      );
      return;
    }

    const canUse = canUseAI(profile?.premium || false);
    if (!canUse) {
      logEvent(AnalyticsEvents.AI_LIMIT_REACHED, {
        premium: profile?.premium || false,
      });
      Alert.alert(
        "AI Limit Reached",
        profile?.premium
          ? "You have reached your monthly AI limit (300 requests). Please wait for next month."
          : "You have reached your free AI limit (20 requests). Upgrade to Premium for more.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    logEvent(AnalyticsEvents.AI_REQUEST_STARTED, {
      type: textType,
      language,
      tone,
    });

    try {
      const result = await generateText({
        type: textType,
        language,
        tone,
        inputText,
      });
      setOutput(result);
      incAI();
      logEvent(AnalyticsEvents.AI_REQUEST_SUCCESS, { type: textType });
    } catch (error) {
      console.error("[AIAssistant] Error generating text:", error);
      logEvent(AnalyticsEvents.AI_REQUEST_FAILED, { error: String(error) });
      Alert.alert("Error", "Failed to generate text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(output);
    Alert.alert("Copied", "Text copied to clipboard");
  };

  const textTypes: { value: AITextType; label: string }[] = [
    { value: "item_title", label: "Item Title" },
    { value: "item_description", label: "Item Description" },
    { value: "invoice_note", label: "Invoice Note" },
    { value: "payment_terms", label: "Payment Terms" },
    { value: "email_cover", label: "Email Cover" },
  ];

  const languages: { value: Language; label: string }[] = [
    { value: "de", label: "German" },
    { value: "en", label: "English" },
  ];

  const tones: { value: ToneType; label: string }[] = [
    { value: "neutral", label: "Neutral" },
    { value: "formal", label: "Formal" },
    { value: "casual", label: "Casual" },
  ];

  const limit = profile?.premium ? 300 : 20;
  const used = profile?.premium ? aiCounters.premiumUsed : aiCounters.freeUsed;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Sparkles size={32} color="#0F766E" />
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>
            Generate professional texts for your invoices and quotes
          </Text>
        </View>

        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>AI Requests This Month</Text>
          <Text style={styles.counterValue}>
            {used} / {limit}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(used / limit) * 100}%` }]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Text Type</Text>
          <View style={styles.optionsRow}>
            {textTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionButton,
                  textType === type.value && styles.optionButtonActive,
                ]}
                onPress={() => setTextType(type.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    textType === type.value && styles.optionButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Language</Text>
          <View style={styles.optionsRow}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.value}
                style={[
                  styles.optionButton,
                  language === lang.value && styles.optionButtonActive,
                ]}
                onPress={() => setLanguage(lang.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    language === lang.value && styles.optionButtonTextActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tone</Text>
          <View style={styles.optionsRow}>
            {tones.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.optionButton,
                  tone === t.value && styles.optionButtonActive,
                ]}
                onPress={() => setTone(t.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    tone === t.value && styles.optionButtonTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Input (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter context or keywords..."
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.generateButtonContent}>
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Text</Text>
            </View>
          )}
        </TouchableOpacity>

        {output && (
          <View style={styles.outputSection}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputLabel}>Generated Text</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Copy size={16} color="#0F766E" />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>{output}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: "center" as const,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center" as const,
  },
  counterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  counterLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  counterValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#0F766E",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0F766E",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    marginHorizontal: -4,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 4,
    marginBottom: 8,
  },
  optionButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  optionButtonTextActive: {
    color: "#0F766E",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 100,
    textAlignVertical: "top" as const,
  },
  generateButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  generateButtonContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  outputSection: {
    marginBottom: 32,
  },
  outputHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  outputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
  },
  copyButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F0FDFA",
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0F766E",
    marginLeft: 4,
  },
  outputBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  outputText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
  },
});
