import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import { useDataStore } from "@/state/dataStore";
import { usePlanStore } from "@/state/planStore";
import type { DocLine, TemplateId } from "@/types";
import { totals } from "@/services/billing";
import { resolveScheme, buildLegalNotes, summarizeTaxBadge } from "@/services/tax";
import { requestInvoiceText } from "@/app/services/aiClient";

export default function QuoteEditorScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const profile = useUserStore((state) => state.profile);
  const clients = useDataStore((state) => state.clients);
  const items = useDataStore((state) => state.items);
  const documents = useDataStore((state) => state.documents);
  const addDocument = useDataStore((state) => state.addDocument);
  const updateDocument = useDataStore((state) => state.updateDocument);
  const nextQuoteNumber = useDataStore((state) => state.nextQuoteNumber);
  const canCreateDoc = usePlanStore((state) => state.canCreateDoc);
  const incDocs = usePlanStore((state) => state.incDocs);

  const existingDoc = editId ? documents.find((d) => d.id === editId) : null;

  const [selectedClientId, setSelectedClientId] = useState<string>(existingDoc?.client.id || "");
  const [lines, setLines] = useState<DocLine[]>(existingDoc?.lines || []);
  const [notes, setNotes] = useState<string>(existingDoc?.notes || "");
  const [showClientPicker, setShowClientPicker] = useState<boolean>(false);
  const [showItemPicker, setShowItemPicker] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const templateOptions: TemplateId[] = profile.premium ? ["modern", "classic", "minimal"] : ["modern"];
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
    existingDoc?.template || profile.defaultTemplate || "modern"
  );

  if (!profile) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleAddItem = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newLine: DocLine = {
      itemId: item.id,
      customTitle: item.title,
      customDesc: item.description,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discountPct: item.discountPct || 0,
    };

    setLines([...lines, newLine]);
    setShowItemPicker(false);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }

    if (lines.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }

    if (!existingDoc && !canCreateDoc(profile.premium)) {
      Alert.alert(
        "Limit Reached",
        "You've reached the free plan limit. Upgrade to Premium for unlimited documents.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => router.push("/paywall" as never),
          },
        ]
      );
      return;
    }

    const taxContext = {
      sellerCountry: profile.country,
      buyerCountry: selectedClient.country || profile.country,
      businessType: selectedClient.businessType || profile.businessTypeDefault || "B2B",
      sellerVatId: profile.vatId,
      buyerVatId: selectedClient.vatId,
      scheme: "STANDARD" as const,
      smallBusinessFlag: profile.smallBusinessFlag || false,
      invoiceDateISO: new Date().toISOString(),
      currency: profile.currency,
      language: profile.language,
    };

    const scheme = resolveScheme(taxContext);
    const totalsResult = totals(lines, scheme);
    const legalNotes = buildLegalNotes({ ...taxContext, scheme });

    if (existingDoc) {
      updateDocument(existingDoc.id, {
        client: selectedClient,
        lines,
        notes,
        template: selectedTemplate,
        taxScheme: scheme,
        subtotalNet: totalsResult.subtotalNet,
        taxTotal: totalsResult.taxTotal,
        totalGross: totalsResult.totalGross,
        legalNotes,
        taxBreakdown: totalsResult.taxBreakdown,
        updatedAtISO: new Date().toISOString(),
      });
      router.back();
    } else {
      const newDocument = {
        id: `doc_${Date.now()}`,
        type: "QUOTE" as const,
        number: nextQuoteNumber(),
        dateISO: new Date().toISOString(),
        seller: profile,
        client: selectedClient,
        currency: profile.currency,
        taxScheme: scheme,
        lines,
        subtotalNet: totalsResult.subtotalNet,
        taxTotal: totalsResult.taxTotal,
        totalGross: totalsResult.totalGross,
        notes,
        template: selectedTemplate,
        legalNotes,
        taxBreakdown: totalsResult.taxBreakdown,
        createdAtISO: new Date().toISOString(),
        updatedAtISO: new Date().toISOString(),
      };

      addDocument(newDocument);
      incDocs();
      router.replace(`/document-preview?id=${newDocument.id}` as never);
    }
  };

  const taxContext = useMemo(() => {
    if (!selectedClient) return null;
    return {
      sellerCountry: profile.country,
      buyerCountry: selectedClient.country || profile.country,
      businessType: selectedClient.businessType || profile.businessTypeDefault || "B2B",
      sellerVatId: profile.vatId,
      buyerVatId: selectedClient.vatId,
      scheme: "STANDARD" as const,
      smallBusinessFlag: profile.smallBusinessFlag || false,
      invoiceDateISO: new Date().toISOString(),
      currency: profile.currency,
      language: profile.language,
    };
  }, [profile, selectedClient]);

  const scheme = taxContext ? resolveScheme(taxContext) : "STANDARD";
  const totalsResult = lines.length > 0 ? totals(lines, scheme) : null;
  const taxBadge = taxContext ? summarizeTaxBadge({ ...taxContext, scheme }) : null;

  const buildAiDetails = (): string => {
    const chunks: string[] = [];
    if (selectedClient) {
      chunks.push(`Kunde: ${selectedClient.name}`);
    }
    if (lines.length > 0) {
      const lineSummary = lines
        .map((line) => `${line.customTitle || "Position"} (${line.qty} ${line.unit || ""})`)
        .join(", ");
      chunks.push(`Leistungen: ${lineSummary}`);
    }
    if (totalsResult) {
      chunks.push(`Angebotssumme: ${profile.currency} ${totalsResult.totalGross.toFixed(2)}`);
    }
    return chunks.join(". ").slice(0, 400);
  };

  const handleGenerateNotes = async () => {
    if (!selectedClient || lines.length === 0) {
      Alert.alert("Hinweis", "Bitte wähle zuerst Kunde und Positionen aus, bevor die KI genutzt wird.");
      return;
    }

    try {
      setAiLoading(true);
      const text = await requestInvoiceText({
        language: profile.language === "en" ? "en" : "de",
        type: "offer",
        details: buildAiDetails() || "Kurzbeschreibung fuer ein Angebot",
      });
      setNotes(text);
    } catch (error: any) {
      const message = error?.message ?? "AI_ERROR";
      if (message === "AI_LIMIT_REACHED") {
        Alert.alert(
          "Limit erreicht",
          "Du hast dein KI-Kontingent ausgeschöpft. Upgrade auf Premium für mehr Anfragen.",
          [
            { text: "Abbrechen", style: "cancel" },
            { text: "Upgrade", onPress: () => router.push("/paywall" as never) },
          ]
        );
      } else if (message === "API_BASE_URL_MISSING") {
        Alert.alert("Konfiguration benötigt", "KI-Endpoint ist nicht konfiguriert.");
      } else {
        Alert.alert("KI nicht verfügbar", "Der KI-Dienst ist aktuell nicht erreichbar. Bitte später erneut versuchen.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: TemplateId) => {
    if (templateId !== "modern" && !profile.premium) {
      Alert.alert(
        "Premium erforderlich",
        "Classic und Minimal Templates sind Premium-Features.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/paywall" as never) },
        ]
      );
      return;
    }
    setSelectedTemplate(templateId);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: existingDoc ? "Edit Quote" : "New Quote",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          {!selectedClient ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowClientPicker(!showClientPicker)}
            >
              <Text style={styles.selectButtonText}>Select Client</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedCard}>
              <View style={styles.selectedCardContent}>
                <Text style={styles.selectedCardTitle}>{selectedClient.name}</Text>
                {selectedClient.email && (
                  <Text style={styles.selectedCardSubtitle}>{selectedClient.email}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedClientId("")}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {showClientPicker && (
            <View style={styles.picker}>
              {clients.length === 0 ? (
                <Text style={styles.emptyText}>No clients yet. Add one first.</Text>
              ) : (
                clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedClientId(client.id);
                      setShowClientPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemTitle}>{client.name}</Text>
                    {client.email && (
                      <Text style={styles.pickerItemSubtitle}>{client.email}</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowItemPicker(!showItemPicker)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {showItemPicker && (
            <View style={styles.picker}>
              {items.length === 0 ? (
                <Text style={styles.emptyText}>No items yet. Add one first.</Text>
              ) : (
                items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.pickerItem}
                    onPress={() => handleAddItem(item.id)}
                  >
                    <Text style={styles.pickerItemTitle}>{item.title}</Text>
                    <Text style={styles.pickerItemSubtitle}>
                      {item.qty} {item.unit} × {profile.currency} {item.unitPrice.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {lines.map((line, index) => (
            <View key={index} style={styles.lineCard}>
              <View style={styles.lineCardContent}>
                <Text style={styles.lineTitle}>{line.customTitle || "Untitled"}</Text>
                <Text style={styles.lineSubtitle}>
                  {line.qty} {line.unit} × {profile.currency} {line.unitPrice.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveLine(index)}>
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {taxBadge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Information</Text>
            <View style={[styles.taxBadge, { backgroundColor: taxBadge.color + "20" }]}>
              <Text style={[styles.taxBadgeText, { color: taxBadge.color }]}>
                {taxBadge.label}
              </Text>
            </View>
          </View>
        )}

        {totalsResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal (Net)</Text>
                <Text style={styles.summaryValue}>
                  {profile.currency} {totalsResult.subtotalNet.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>
                  {profile.currency} {totalsResult.taxTotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelTotal}>Total</Text>
                <Text style={styles.summaryValueTotal}>
                  {profile.currency} {totalsResult.totalGross.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template</Text>
          <View style={styles.templateRow}>
            {templateOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.templateChip, selectedTemplate === option && styles.templateChipActive]}
                onPress={() => handleTemplateSelect(option)}
              >
                <Text
                  style={[
                    styles.templateChipText,
                    selectedTemplate === option && styles.templateChipTextActive,
                  ]}
                >
                  {option === "modern"
                    ? "Modern"
                    : option === "classic"
                    ? "Classic"
                    : "Minimal"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TouchableOpacity
              style={[styles.aiButton, aiLoading && styles.aiButtonDisabled]}
              onPress={handleGenerateNotes}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <Text style={styles.aiButtonText}>KI-Vorschlag</Text>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes for this quote..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{existingDoc ? "Update Quote" : "Create Quote"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  selectedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  selectedCardContent: {
    flex: 1,
  },
  selectedCardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  selectedCardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  changeText: {
    fontSize: 14,
    color: "#0F766E",
    fontWeight: "600" as const,
  },
  picker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden" as const,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerItemTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#111827",
  },
  pickerItemSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  emptyText: {
    padding: 16,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center" as const,
  },
  addButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#0F766E",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  lineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  lineCardContent: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#111827",
  },
  lineSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  taxBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start" as const,
  },
  taxBadgeText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#111827",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#0F766E",
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
  },
  aiButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0F766E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minWidth: 110,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  templateRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  templateChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  templateChipActive: {
    borderColor: "#0F766E",
    backgroundColor: "#0F766E11",
  },
  templateChipText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#374151",
  },
  templateChipTextActive: {
    color: "#0F766E",
  },
  spacer: {
    height: 100,
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center" as const,
    padding: 16,
  },
});
