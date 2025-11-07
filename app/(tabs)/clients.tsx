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
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, FileText, ChevronDown, ChevronUp } from "lucide-react-native";
import { useDataStore } from "@/state/dataStore";
import type { Client, CountryCode, BusinessType } from "@/types";
import { ButtonPrimary } from "@/components/ButtonPrimary";
import { LabeledInput } from "@/components/LabeledInput";
import { CountryPicker } from "@/components/CountryPicker";
import { validateClient } from "@/services/validators";
import { logEvent, AnalyticsEvents } from "@/services/analytics";

export default function ClientsScreen() {
  const clients = useDataStore((state) => state.clients);
  const addClient = useDataStore((state) => state.addClient);
  const updateClient = useDataStore((state) => state.updateClient);
  const removeClient = useDataStore((state) => state.removeClient);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const documents = useDataStore((state) => state.documents);

  const handleAdd = () => {
    setEditingClient(null);
    setFormData({});
    setErrors([]);
    setModalVisible(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setErrors([]);
    setModalVisible(true);
  };

  const handleSave = () => {
    const validationErrors = validateClient(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, formData as Partial<Client>);
      logEvent(AnalyticsEvents.CLIENT_UPDATE, { clientId: editingClient.id });
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        name: formData.name || "",
        email: formData.email,
        phone: formData.phone,
        street: formData.street,
        zip: formData.zip,
        city: formData.city,
        country: formData.country,
        vatId: formData.vatId,
        notes: formData.notes,
        businessType: formData.businessType || "B2C",
      };
      addClient(newClient);
      logEvent(AnalyticsEvents.CLIENT_ADD, { clientId: newClient.id });
    }

    setModalVisible(false);
  };

  const handleDelete = (client: Client) => {
    Alert.alert(
      "Delete Client",
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeClient(client.id);
            logEvent(AnalyticsEvents.CLIENT_DELETE, { clientId: client.id });
          },
        },
      ]
    );
  };

  const getClientDocuments = (clientId: string) => {
    return documents.filter((doc) => doc.client.id === clientId);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderClient = ({ item }: { item: Client }) => {
    const clientDocs = getClientDocuments(item.id);
    const isExpanded = expandedClientId === item.id;

    return (
      <View style={styles.clientWrapper}>
        <TouchableOpacity
          style={styles.clientCard}
          onPress={() => handleEdit(item)}
          onLongPress={() => handleDelete(item)}
        >
          <View style={styles.clientHeader}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientCountry}>{item.country || "—"}</Text>
          </View>
          {item.email && <Text style={styles.clientDetail}>{item.email}</Text>}
          {item.vatId && <Text style={styles.clientDetail}>VAT: {item.vatId}</Text>}
          <View style={styles.clientFooter}>
            {item.businessType && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.businessType}</Text>
              </View>
            )}
            {clientDocs.length > 0 && (
              <TouchableOpacity
                style={styles.docsButton}
                onPress={() => setExpandedClientId(isExpanded ? null : item.id)}
              >
                <FileText size={14} color="#0F766E" />
                <Text style={styles.docsButtonText}>{clientDocs.length} docs</Text>
                {isExpanded ? (
                  <ChevronUp size={16} color="#0F766E" />
                ) : (
                  <ChevronDown size={16} color="#0F766E" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && clientDocs.length > 0 && (
          <View style={styles.docsContainer}>
            {clientDocs.map((doc) => (
              <View key={doc.id} style={styles.docItem}>
                <View style={styles.docHeader}>
                  <View
                    style={[
                      styles.docTypeBadge,
                      {
                        backgroundColor:
                          doc.type === "INVOICE" ? "#DBEAFE" : "#EDE9FE",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.docTypeText,
                        {
                          color: doc.type === "INVOICE" ? "#1E40AF" : "#6B21A8",
                        },
                      ]}
                    >
                      {doc.type === "INVOICE" ? "Invoice" : "Quote"}
                    </Text>
                  </View>
                  <Text style={styles.docNumber}>{doc.number}</Text>
                </View>
                <View style={styles.docFooter}>
                  <Text style={styles.docDate}>{formatDate(doc.dateISO)}</Text>
                  <Text style={styles.docAmount}>
                    {formatCurrency(doc.totalGross, doc.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No clients yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first client to get started
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingClient ? "Edit Client" : "New Client"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {errors.length > 0 && (
              <View style={styles.errorBox}>
                {errors.map((err, idx) => (
                  <Text key={idx} style={styles.errorText}>
                    • {err}
                  </Text>
                ))}
              </View>
            )}

            <LabeledInput
              label="Client Name"
              value={formData.name || ""}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="ABC Company GmbH"
              required
            />

            <LabeledInput
              label="Email"
              value={formData.email || ""}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="contact@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <LabeledInput
              label="Phone"
              value={formData.phone || ""}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+43 1 234 5678"
              keyboardType="phone-pad"
            />

            <LabeledInput
              label="Street"
              value={formData.street || ""}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
              placeholder="Hauptstraße 123"
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label="ZIP"
                  value={formData.zip || ""}
                  onChangeText={(text) => setFormData({ ...formData, zip: text })}
                  placeholder="1010"
                />
              </View>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label="City"
                  value={formData.city || ""}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Vienna"
                />
              </View>
            </View>

            <CountryPicker
              label="Country"
              value={formData.country}
              onSelect={(code) => setFormData({ ...formData, country: code })}
            />

            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>Business Type</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    formData.businessType === "B2B" && styles.selectorButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, businessType: "B2B" })}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      formData.businessType === "B2B" && styles.selectorButtonTextActive,
                    ]}
                  >
                    Business (B2B)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    formData.businessType === "B2C" && styles.selectorButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, businessType: "B2C" })}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      formData.businessType === "B2C" && styles.selectorButtonTextActive,
                    ]}
                  >
                    Private (B2C)
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.selectorHint}>
                {formData.businessType === "B2B" 
                  ? "For businesses with VAT ID" 
                  : "For private customers without VAT ID"}
              </Text>
            </View>

            <LabeledInput
              label="VAT ID (optional)"
              value={formData.vatId || ""}
              onChangeText={(text) => setFormData({ ...formData, vatId: text })}
              placeholder="ATU12345678"
            />

            <LabeledInput
              label="Notes"
              value={formData.notes || ""}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Internal notes..."
              multiline
              numberOfLines={3}
            />

            <ButtonPrimary
              title={editingClient ? "Save Changes" : "Add Client"}
              onPress={handleSave}
              style={styles.saveButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  list: {
    padding: 16,
  },
  clientCard: {
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
  clientHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
    flex: 1,
  },
  clientCountry: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  clientDetail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start" as const,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#1E40AF",
  },
  empty: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  fab: {
    position: "absolute" as const,
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0F766E",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#111827",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row" as const,
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  selectorSection: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
  },
  selectorButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  selectorButtonTextActive: {
    color: "#0F766E",
  },
  selectorHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  clientWrapper: {
    marginBottom: 12,
  },
  clientFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 8,
  },
  docsButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  docsButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#0F766E",
  },
  docsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: -8,
    marginBottom: 12,
  },
  docItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  docHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  docTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  docTypeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  docNumber: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  docFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  docDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  docAmount: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
  },
});
