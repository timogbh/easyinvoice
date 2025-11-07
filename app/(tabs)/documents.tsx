import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { FileText, Filter, X, Eye, Copy, Trash2, Download, Edit2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useDataStore } from "@/state/dataStore";
import type { Document, DocType } from "@/types";
import { getCountryName } from "@/constants/countries";

export default function DocumentsScreen() {
  const router = useRouter();
  const documents = useDataStore((state) => state.documents);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<DocType | "ALL">("ALL");
  const [filterYear, setFilterYear] = useState<number | "ALL">("ALL");
  const [filterClient, setFilterClient] = useState<string | "ALL">("ALL");
  const [longPressDoc, setLongPressDoc] = useState<Document | null>(null);

  const clients = useDataStore((state) => state.clients);
  const removeDocument = useDataStore((state) => state.removeDocument);

  const availableYears = Array.from(
    new Set(
      documents.map((doc) => new Date(doc.dateISO).getFullYear())
    )
  ).sort((a, b) => b - a);

  const filteredDocuments = documents.filter((doc) => {
    if (filterType !== "ALL" && doc.type !== filterType) return false;
    if (filterYear !== "ALL" && new Date(doc.dateISO).getFullYear() !== filterYear)
      return false;
    if (filterClient !== "ALL" && doc.client.id !== filterClient) return false;
    return true;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime();
  });

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const calculateSummary = () => {
    const invoices = filteredDocuments.filter((d) => d.type === "INVOICE");
    const subtotalNet = invoices.reduce((sum, doc) => sum + doc.subtotalNet, 0);
    const taxTotal = invoices.reduce((sum, doc) => sum + doc.taxTotal, 0);
    const totalGross = invoices.reduce((sum, doc) => sum + doc.totalGross, 0);
    return { subtotalNet, taxTotal, totalGross };
  };

  const summary = calculateSummary();

  const handleLongPress = (doc: Document) => {
    setLongPressDoc(doc);
  };

  const handlePreview = () => {
    if (longPressDoc) {
      console.log("Preview document:", longPressDoc);
      router.push({
        pathname: "/document-preview",
        params: { id: longPressDoc.id },
      });
      setLongPressDoc(null);
    }
  };

  const handleEdit = () => {
    if (longPressDoc) {
      console.log("Edit document:", longPressDoc);
      const editorPath = longPressDoc.type === "INVOICE" ? "/invoice-editor" : "/quote-editor";
      router.push({
        pathname: editorPath,
        params: { editId: longPressDoc.id },
      });
      setLongPressDoc(null);
    }
  };

  const handleDuplicate = () => {
    if (longPressDoc) {
      Alert.alert(
        "Duplicate Document",
        "This feature will be available soon."
      );
      setLongPressDoc(null);
    }
  };

  const handleDelete = () => {
    if (longPressDoc) {
      Alert.alert(
        "Delete Document",
        `Are you sure you want to delete ${longPressDoc.number}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              removeDocument(longPressDoc.id);
              setLongPressDoc(null);
            },
          },
        ]
      );
    }
  };

  const handleExportAll = () => {
    console.log("Export all documents as ZIP");
    Alert.alert(
      "Export Documents",
      "This feature will be available soon. It will export all filtered documents as a ZIP file."
    );
  };

  const getTypeColor = (type: DocType) => {
    return type === "INVOICE" ? "#0F766E" : "#7C3AED";
  };

  const getTypeLabel = (type: DocType) => {
    return type === "INVOICE" ? "Invoice" : "Quote";
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={styles.documentHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + "20" }]}>
          <FileText size={16} color={getTypeColor(item.type)} />
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={styles.documentNumber}>{item.number}</Text>
      </View>

      <View style={styles.documentContent}>
        <Text style={styles.clientName}>{item.client.name}</Text>
        {item.client.country && (
          <Text style={styles.clientCountry}>{getCountryName(item.client.country)}</Text>
        )}
        
        <View style={styles.documentFooter}>
          <View>
            <Text style={styles.dateLabel}>Date</Text>
            <Text style={styles.dateValue}>{formatDate(item.dateISO)}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(item.totalGross, item.currency)}
            </Text>
          </View>
        </View>

        {item.taxScheme && item.taxScheme !== "STANDARD" && (
          <View style={styles.taxBadge}>
            <Text style={styles.taxBadgeText}>
              {item.taxScheme === "REVERSE_CHARGE" ? "Reverse Charge" : "Tax Exempt"}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{documents.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.invoiceColor]}>
              {documents.filter((d) => d.type === "INVOICE").length}
            </Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.quoteColor]}>
              {documents.filter((d) => d.type === "QUOTE").length}
            </Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </View>
        </View>

        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={16} color="#6B7280" />
            <Text style={styles.filterChipText}>
              {filterType === "ALL" ? "All" : getTypeLabel(filterType)}
            </Text>
          </TouchableOpacity>
          {availableYears.length > 0 && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterChipText}>
                {filterYear === "ALL" ? "All Years" : filterYear}
              </Text>
            </TouchableOpacity>
          )}
          {clients.length > 0 && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterChipText}>
                {filterClient === "ALL"
                  ? "All Clients"
                  : clients.find((c) => c.id === filterClient)?.name || "Client"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportAll}>
          <Download size={16} color="#0F766E" />
          <Text style={styles.exportButtonText}>Export ZIP</Text>
        </TouchableOpacity>
      </View>

      {filteredDocuments.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary (Invoices)</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal (Net):</Text>
            <Text style={styles.summaryValue}>
              EUR {summary.subtotalNet.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>
              EUR {summary.taxTotal.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Total (Gross):</Text>
            <Text style={styles.summaryValueTotal}>
              EUR {summary.totalGross.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={sortedDocuments}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FileText size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No documents yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first invoice or quote from the Dashboard
            </Text>
          </View>
        }
      />

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Documents</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterType === "ALL" && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setFilterType("ALL");
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterType === "ALL" && styles.filterOptionTextActive,
                  ]}
                >
                  All Documents
                </Text>
                {filterType === "ALL" && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterType === "INVOICE" && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setFilterType("INVOICE");
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterType === "INVOICE" && styles.filterOptionTextActive,
                  ]}
                >
                  Invoices Only
                </Text>
                {filterType === "INVOICE" && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterType === "QUOTE" && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setFilterType("QUOTE");
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterType === "QUOTE" && styles.filterOptionTextActive,
                  ]}
                >
                  Quotes Only
                </Text>
                {filterType === "QUOTE" && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Year</Text>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterYear === "ALL" && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setFilterYear("ALL");
                    setFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterYear === "ALL" && styles.filterOptionTextActive,
                    ]}
                  >
                    All Years
                  </Text>
                  {filterYear === "ALL" && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {availableYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.filterOption,
                      filterYear === year && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setFilterYear(year);
                      setFilterModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterYear === year && styles.filterOptionTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                    {filterYear === year && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Client</Text>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterClient === "ALL" && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setFilterClient("ALL");
                    setFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterClient === "ALL" && styles.filterOptionTextActive,
                    ]}
                  >
                    All Clients
                  </Text>
                  {filterClient === "ALL" && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.filterOption,
                      filterClient === client.id && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setFilterClient(client.id);
                      setFilterModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterClient === client.id &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {client.name}
                    </Text>
                    {filterClient === client.id && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={longPressDoc !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLongPressDoc(null)}
      >
        <View style={styles.actionModalOverlay}>
          <View style={styles.actionModalContainer}>
            <Text style={styles.actionModalTitle}>{longPressDoc?.number}</Text>

            <TouchableOpacity style={styles.actionOption} onPress={handlePreview}>
              <Eye size={20} color="#0F766E" />
              <Text style={styles.actionOptionText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
              <Edit2 size={20} color="#0F766E" />
              <Text style={styles.actionOptionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDuplicate}
            >
              <Copy size={20} color="#0F766E" />
              <Text style={styles.actionOptionText}>Duplicate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionOption, styles.actionOptionDanger]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#DC2626" />
              <Text style={[styles.actionOptionText, styles.actionOptionTextDanger]}>
                Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOptionCancel}
              onPress={() => setLongPressDoc(null)}
            >
              <Text style={styles.actionOptionCancelText}>Cancel</Text>
            </TouchableOpacity>
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
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statsContainer: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 4,
  },
  invoiceColor: {
    color: "#0F766E",
  },
  quoteColor: {
    color: "#7C3AED",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  filtersRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#374151",
  },
  exportButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F0FDFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0F766E",
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0F766E",
  },
  list: {
    padding: 16,
  },
  documentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  documentHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  documentNumber: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  documentContent: {
    gap: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
  },
  clientCountry: {
    fontSize: 14,
    color: "#6B7280",
  },
  documentFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dateLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#374151",
  },
  amountContainer: {
    alignItems: "flex-end" as const,
  },
  amountLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#0F766E",
  },
  taxBadge: {
    alignSelf: "flex-start" as const,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  taxBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#92400E",
  },
  empty: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center" as const,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
  },
  modalContent: {
    padding: 16,
  },
  filterOption: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: "#F0FDFA",
    borderWidth: 2,
    borderColor: "#0F766E",
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#374151",
  },
  filterOptionTextActive: {
    color: "#0F766E",
    fontWeight: "600" as const,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0F766E",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  filterSection: {
    marginTop: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  summary: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
  },
  summaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    marginTop: 8,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#0F766E",
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },
  actionModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 320,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 16,
    textAlign: "center" as const,
  },
  actionOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  actionOptionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#111827",
  },
  actionOptionDanger: {
    backgroundColor: "#FEE2E2",
  },
  actionOptionTextDanger: {
    color: "#DC2626",
  },
  actionOptionCancel: {
    padding: 16,
    alignItems: "center" as const,
    marginTop: 8,
  },
  actionOptionCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
});
