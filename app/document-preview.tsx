import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Share2, Edit, Sparkles } from "lucide-react-native";
import { useDataStore } from "@/state/dataStore";
import { useUserStore } from "@/state/userStore";
import { usePlanStore } from "@/state/planStore";
import { renderDocumentPDF } from "@/services/pdf";
import { formatCurrency, formatDate } from "@/utils/format";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import type { TemplateId } from "@/types";

export default function DocumentPreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const documents = useDataStore((state) => state.documents);
  const updateDocument = useDataStore((state) => state.updateDocument);
  const profile = useUserStore((state) => state.profile);
  const canCreateDoc = usePlanStore((state) => state.canCreateDoc);
  const incDocs = usePlanStore((state) => state.incDocs);
  const [isExporting, setIsExporting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<"notes" | "legalNotes" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [useAI, setUseAI] = useState(false);

  const doc = documents.find((d) => d.id === id);

  if (!doc) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document not found</Text>
          <TouchableOpacity style={styles.backButtonAlt} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const template: TemplateId = doc.template || "modern";
  const brandColor = doc.seller.brandColor ? `#${doc.seller.brandColor}` : "#0F766E";

  const handleExport = async () => {
    // Check if this is a new document (not yet saved) and if limits are reached
    const isNewDoc = !documents.find((d) => d.id === doc.id);
    if (isNewDoc && profile && !canCreateDoc(profile.premium)) {
      Alert.alert(
        "Limit erreicht",
        "Sie haben das Limit für kostenlose Dokumente erreicht. Upgrade auf Premium für unbegrenzte Dokumente.",
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => router.push("/paywall" as never),
          },
        ]
      );
      return;
    }

    setIsExporting(true);
    try {
      console.log("[DocumentPreview] Starting PDF export...");
      
      // Increment counter if this is a new document
      if (isNewDoc && profile && !profile.premium) {
        incDocs();
      }
      
      const result = await renderDocumentPDF(doc, template);
      const isPdf = result.filePath.toLowerCase().endsWith(".pdf");
      const mimeType = isPdf ? "application/pdf" : "text/html";
      const uti = isPdf ? "com.adobe.pdf" : "public.html";

      console.log("[DocumentPreview] Export saved at:", result.filePath);
      
      if (Platform.OS === "web") {
        const encoding = isPdf ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8;
        const fileContent = await FileSystem.readAsStringAsync(result.filePath, { encoding });

        let blob: Blob;
        if (isPdf) {
          const byteCharacters = atob(fileContent);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i += 1) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: mimeType });
        } else {
          blob = new Blob([fileContent], { type: mimeType });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.number}.${isPdf ? "pdf" : "html"}`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("Erfolg", "Dokument wurde heruntergeladen!");
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(result.filePath, {
            mimeType,
            dialogTitle: `Export ${doc.number}`,
            UTI: uti,
          });
        } else {
          Alert.alert("Fehler", "Sharing ist auf diesem Gerät nicht verfügbar");
        }
      }
    } catch (error) {
      console.error("[DocumentPreview] Export error:", error);
      Alert.alert("Fehler", "PDF konnte nicht exportiert werden");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = () => {
    const editorPath = doc.type === "INVOICE" ? "/invoice-editor" : "/quote-editor";
    router.push({
      pathname: editorPath,
      params: { editId: doc.id },
    });
  };

  const handleEditField = (field: "notes" | "legalNotes") => {
    setEditField(field);
    if (field === "notes") {
      setEditValue(doc.notes || "");
    } else {
      setEditValue(doc.legalNotes?.join("\n") || "");
    }
    setEditModalVisible(true);
  };

  const handleSaveField = () => {
    if (!editField) return;

    if (editField === "notes") {
      updateDocument(doc.id, { notes: editValue });
    } else if (editField === "legalNotes") {
      const notesArray = editValue.split("\n").filter((line) => line.trim());
      updateDocument(doc.id, { legalNotes: notesArray });
    }

    setEditModalVisible(false);
    setEditField(null);
    setEditValue("");
    setUseAI(false);
  };

  const handleAIAssist = () => {
    Alert.alert(
      "KI-Assistenz",
      "KI-Assistenz wird bald verfügbar sein. Sie hilft dir beim Verfassen professioneller Notizen und Zahlungsbedingungen."
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Vorschau",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Edit size={20} color="#111827" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        <View style={[styles.header, { borderLeftColor: brandColor }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              {doc.seller.logoUrl && (
                <View style={styles.logoContainer}>
                  <Text style={styles.logoPlaceholder}>Logo</Text>
                </View>
              )}
              <View>
                <Text style={styles.companyName}>{doc.seller.displayName}</Text>
                <Text style={styles.companyDetails}>
                  {doc.seller.street && `${doc.seller.street}\n`}
                  {doc.seller.zip} {doc.seller.city}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={[styles.docType, { color: brandColor }]}>
                {doc.type === "INVOICE" ? "Rechnung" : "Angebot"}
              </Text>
              <Text style={styles.docNumber}>{doc.number}</Text>
              <Text style={styles.docDate}>{formatDate(doc.dateISO, doc.seller.language)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Kunde</Text>
          <View style={styles.clientCard}>
            <Text style={styles.clientName}>{doc.client.name}</Text>
            {doc.client.street && <Text style={styles.clientDetail}>{doc.client.street}</Text>}
            {(doc.client.zip || doc.client.city) && (
              <Text style={styles.clientDetail}>
                {doc.client.zip} {doc.client.city}
              </Text>
            )}
            {doc.client.country && <Text style={styles.clientDetail}>{doc.client.country}</Text>}
            {doc.client.vatId && (
              <Text style={styles.clientDetail}>UID: {doc.client.vatId}</Text>
            )}
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Positionen</Text>
          <View style={styles.itemsTable}>
            <View style={[styles.tableHeader, { backgroundColor: brandColor + "15" }]}>
              <Text style={[styles.tableHeaderText, styles.colPos]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>Beschreibung</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Menge</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Preis</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Gesamt</Text>
            </View>
            {doc.lines.map((line, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tableCell, styles.colPos]}>{idx + 1}</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{line.customTitle || "Untitled"}</Text>
                  {line.customDesc && (
                    <Text style={styles.itemDesc}>{line.customDesc}</Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {line.qty} {line.unit}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(line.unitPrice, doc.currency, doc.seller.language)}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal, styles.itemTotal]}>
                  {formatCurrency(
                    line.unitPrice * line.qty * (1 - (line.discountPct || 0) / 100),
                    doc.currency,
                    doc.seller.language
                  )}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Zwischensumme (Netto):</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(doc.subtotalNet, doc.currency, doc.seller.language)}
              </Text>
            </View>
            {doc.taxBreakdown && doc.taxBreakdown.length > 0 && doc.taxBreakdown.map((item, idx) => (
              <View key={idx} style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>MwSt. {item.rate}%:</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(item.tax, doc.currency, doc.seller.language)}
                </Text>
              </View>
            ))}
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabelTotal}>Gesamtbetrag:</Text>
              <Text style={[styles.totalsValueTotal, { color: brandColor }]}>
                {formatCurrency(doc.totalGross, doc.currency, doc.seller.language)}
              </Text>
            </View>
          </View>
        </View>

        {(doc.taxScheme === "REVERSE_CHARGE" || 
          (doc.taxScheme === "EXEMPT" && doc.seller.smallBusinessFlag)) && (
          <View style={styles.noticeSection}>
            {doc.taxScheme === "REVERSE_CHARGE" && (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeText}>
                  ⚠ Reverse Charge: Steuerschuldnerschaft des Leistungsempfängers
                </Text>
              </View>
            )}
            {doc.taxScheme === "EXEMPT" && doc.seller.smallBusinessFlag && (
              <View style={[styles.noticeCard, styles.noticeCardInfo]}>
                <Text style={[styles.noticeText, styles.noticeTextInfo]}>
                  ℹ Kleinunternehmerregelung gemäß §19 UStG - keine Umsatzsteuer ausgewiesen
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bemerkungen</Text>
            <TouchableOpacity
              style={styles.editFieldButton}
              onPress={() => handleEditField("notes")}
            >
              <Edit size={16} color="#0F766E" />
              <Text style={styles.editFieldButtonText}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          {doc.notes ? (
            <Text style={styles.notesText}>{doc.notes}</Text>
          ) : (
            <Text style={styles.emptyFieldText}>Keine Bemerkungen hinzugefügt</Text>
          )}
        </View>

        {doc.seller.iban && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Zahlungsinformationen</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>IBAN:</Text>
                <Text style={styles.paymentValue}>{doc.seller.iban}</Text>
              </View>
              {doc.seller.bic && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>BIC:</Text>
                  <Text style={styles.paymentValue}>{doc.seller.bic}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.legalSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rechtliche Hinweise</Text>
            <TouchableOpacity
              style={styles.editFieldButton}
              onPress={() => handleEditField("legalNotes")}
            >
              <Edit size={16} color="#0F766E" />
              <Text style={styles.editFieldButtonText}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
          {doc.legalNotes && doc.legalNotes.length > 0 ? (
            doc.legalNotes.map((note, idx) => (
              <Text key={idx} style={styles.legalNote}>
                • {note}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyFieldText}>Keine rechtlichen Hinweise</Text>
          )}
        </View>

        <View style={styles.templateInfo}>
          <Text style={styles.templateText}>Template: {template}</Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: brandColor }]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Share2 size={20} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Als PDF exportieren</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editField === "notes" ? "Bemerkungen bearbeiten" : "Rechtliche Hinweise bearbeiten"}
            </Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.aiToggleContainer}>
              <TouchableOpacity
                style={[styles.aiToggleButton, useAI && styles.aiToggleButtonActive]}
                onPress={() => setUseAI(!useAI)}
              >
                <Sparkles size={16} color={useAI ? "#FFFFFF" : "#7C3AED"} />
                <Text style={[styles.aiToggleText, useAI && styles.aiToggleTextActive]}>
                  Mit KI-Unterstützung
                </Text>
              </TouchableOpacity>
              {useAI && (
                <TouchableOpacity
                  style={styles.aiAssistButton}
                  onPress={handleAIAssist}
                >
                  <Text style={styles.aiAssistButtonText}>KI generieren</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={
                editField === "notes"
                  ? "Füge Bemerkungen hinzu..."
                  : "Füge rechtliche Hinweise hinzu (eine pro Zeile)..."
              }
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveField}
              >
                <Text style={styles.modalSaveButtonText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: "row" as const,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  headerLeft: {
    flex: 1,
    gap: 12,
  },
  logoContainer: {
    width: 120,
    height: 50,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  logoPlaceholder: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  companyName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  docType: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 2,
  },
  docDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  clientSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  clientCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  itemsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  itemsTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: "row" as const,
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#374151",
    textTransform: "uppercase" as const,
  },
  tableRow: {
    flexDirection: "row" as const,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  tableCell: {
    fontSize: 14,
    color: "#374151",
  },
  colPos: {
    width: 40,
  },
  colDesc: {
    flex: 1,
    paddingRight: 12,
  },
  colQty: {
    width: 80,
    textAlign: "center" as const,
  },
  colPrice: {
    width: 90,
    textAlign: "right" as const,
  },
  colTotal: {
    width: 90,
    textAlign: "right" as const,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#111827",
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  itemTotal: {
    fontWeight: "600" as const,
    color: "#111827",
  },
  totalsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  totalsCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 6,
  },
  totalsLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#111827",
  },
  totalsDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalsLabelTotal: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
  },
  totalsValueTotal: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  noticeSection: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  noticeCard: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  noticeCardInfo: {
    backgroundColor: "#DBEAFE",
    borderLeftColor: "#3B82F6",
  },
  noticeText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500" as const,
  },
  noticeTextInfo: {
    color: "#1E40AF",
  },
  notesSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  editFieldButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editFieldButtonText: {
    fontSize: 12,
    color: "#0F766E",
    fontWeight: "600" as const,
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
  },
  emptyFieldText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic" as const,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
  },
  paymentSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: "row" as const,
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    width: 60,
  },
  paymentValue: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  legalSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  legalNote: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 4,
    paddingLeft: 8,
  },
  templateInfo: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  templateText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center" as const,
    textTransform: "capitalize" as const,
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
  exportButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginBottom: 24,
    textAlign: "center" as const,
  },
  backButtonAlt: {
    backgroundColor: "#0F766E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
  },
  modalCloseText: {
    fontSize: 24,
    color: "#6B7280",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  aiToggleContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 16,
  },
  aiToggleButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7C3AED",
    backgroundColor: "#FFFFFF",
  },
  aiToggleButtonActive: {
    backgroundColor: "#7C3AED",
  },
  aiToggleText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#7C3AED",
  },
  aiToggleTextActive: {
    color: "#FFFFFF",
  },
  aiAssistButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#7C3AED",
  },
  aiAssistButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  editInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 200,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalActions: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center" as const,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0F766E",
    alignItems: "center" as const,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
