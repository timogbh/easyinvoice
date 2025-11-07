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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, Sparkles } from "lucide-react-native";
import { useDataStore } from "@/state/dataStore";
import { useUserStore } from "@/state/userStore";
import { usePlanStore } from "@/state/planStore";
import type { Item, UnitType } from "@/types";
import { ButtonPrimary } from "@/components/ButtonPrimary";
import { LabeledInput } from "@/components/LabeledInput";
import { logEvent, AnalyticsEvents } from "@/services/analytics";
import { generateItemTitle, generateItemDescription } from "@/services/ai";

export default function ItemsScreen() {
  const items = useDataStore((state) => state.items);
  const addItem = useDataStore((state) => state.addItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState<"title" | "description" | null>(null);

  const profile = useUserStore((state) => state.profile);
  const aiSettings = useUserStore((state) => state.aiSettings);
  const canUseAI = usePlanStore((state) => state.canUseAI);
  const incAI = usePlanStore((state) => state.incAI);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ qty: 1, unit: "Stk", taxRate: 20 });
    setErrors([]);
    setModalVisible(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData(item);
    setErrors([]);
    setModalVisible(true);
  };

  const handleSave = () => {
    const validationErrors: string[] = [];

    if (!formData.title?.trim()) {
      validationErrors.push("Item title is required");
    }
    if (!formData.unitPrice || formData.unitPrice <= 0) {
      validationErrors.push("Unit price must be greater than 0");
    }
    if (!formData.qty || formData.qty <= 0) {
      validationErrors.push("Quantity must be greater than 0");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (editingItem) {
      updateItem(editingItem.id, formData as Partial<Item>);
      logEvent(AnalyticsEvents.ITEM_UPDATE, { itemId: editingItem.id });
    } else {
      const newItem: Item = {
        id: Date.now().toString(),
        title: formData.title || "",
        description: formData.description,
        qty: formData.qty || 1,
        unit: formData.unit || "Stk",
        unitPrice: formData.unitPrice || 0,
        taxRate: formData.taxRate || 20,
        discountPct: formData.discountPct,
      };
      addItem(newItem);
      logEvent(AnalyticsEvents.ITEM_ADD, { itemId: newItem.id });
    }

    setModalVisible(false);
  };

  const handleDelete = (item: Item) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete ${item.title}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeItem(item.id);
            logEvent(AnalyticsEvents.ITEM_DELETE, { itemId: item.id });
          },
        },
      ]
    );
  };

  const handleGenerateTitle = async () => {
    if (!aiSettings.enabled) {
      Alert.alert(
        "AI Disabled",
        "AI features are disabled. Enable them in Settings."
      );
      return;
    }

    if (!canUseAI(profile?.premium || false)) {
      Alert.alert(
        "AI Limit Reached",
        `You've reached your AI usage limit for this month. ${profile?.premium ? "Premium: 300/month" : "Free: 20/month. Upgrade for more!"}`
      );
      return;
    }

    setLoadingAI("title");
    logEvent(AnalyticsEvents.AI_REQUEST_STARTED, { type: "item_title" });

    try {
      const title = await generateItemTitle({
        language: aiSettings.language,
        tone: aiSettings.tone,
      });
      setFormData({ ...formData, title });
      incAI();
      logEvent(AnalyticsEvents.AI_REQUEST_SUCCESS, { type: "item_title" });
    } catch (error) {
      console.error("Failed to generate title:", error);
      logEvent(AnalyticsEvents.AI_REQUEST_FAILED, { type: "item_title" });
      Alert.alert("Error", "Failed to generate title. Please try again.");
    } finally {
      setLoadingAI(null);
    }
  };

  const handleGenerateDescription = async () => {
    if (!aiSettings.enabled) {
      Alert.alert(
        "AI Disabled",
        "AI features are disabled. Enable them in Settings."
      );
      return;
    }

    if (!canUseAI(profile?.premium || false)) {
      Alert.alert(
        "AI Limit Reached",
        `You've reached your AI usage limit for this month. ${profile?.premium ? "Premium: 300/month" : "Free: 20/month. Upgrade for more!"}`
      );
      return;
    }

    setLoadingAI("description");
    logEvent(AnalyticsEvents.AI_REQUEST_STARTED, { type: "item_description" });

    try {
      const description = await generateItemDescription({
        title: formData.title,
        language: aiSettings.language,
        tone: aiSettings.tone,
      });
      setFormData({ ...formData, description });
      incAI();
      logEvent(AnalyticsEvents.AI_REQUEST_SUCCESS, {
        type: "item_description",
      });
    } catch (error) {
      console.error("Failed to generate description:", error);
      logEvent(AnalyticsEvents.AI_REQUEST_FAILED, {
        type: "item_description",
      });
      Alert.alert("Error", "Failed to generate description. Please try again.");
    } finally {
      setLoadingAI(null);
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleEdit(item)}
      onLongPress={() => handleDelete(item)}
    >
      <Text style={styles.title}>{item.title}</Text>
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
      <View style={styles.priceRow}>
        <Text style={styles.price}>
          {item.unitPrice.toFixed(2)} EUR / {item.unit}
        </Text>
        <Text style={styles.taxBadge}>{item.taxRate}% VAT</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first item or service to get started
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
              {editingItem ? "Edit Item" : "New Item"}
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

            <View>
              <View style={styles.inputWithAI}>
                <View style={styles.flexOne}>
                  <LabeledInput
                    label="Item Title"
                    value={formData.title || ""}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Web Development"
                    required
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.aiButton,
                    (!aiSettings.enabled || loadingAI !== null) &&
                      styles.aiButtonDisabled,
                  ]}
                  onPress={handleGenerateTitle}
                  disabled={!aiSettings.enabled || loadingAI !== null}
                >
                  {loadingAI === "title" ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Sparkles size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <View style={styles.inputWithAI}>
                <View style={styles.flexOne}>
                  <LabeledInput
                    label="Description"
                    value={formData.description || ""}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                    placeholder="Detailed description..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.aiButton,
                    (!aiSettings.enabled || loadingAI !== null) &&
                      styles.aiButtonDisabled,
                  ]}
                  onPress={handleGenerateDescription}
                  disabled={!aiSettings.enabled || loadingAI !== null}
                >
                  {loadingAI === "description" ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Sparkles size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label="Unit Price (Net)"
                  value={formData.unitPrice?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      unitPrice: parseFloat(text) || 0,
                    })
                  }
                  placeholder="100.00"
                  keyboardType="decimal-pad"
                  required
                />
              </View>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label="Tax Rate (%)"
                  value={formData.taxRate?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, taxRate: parseFloat(text) || 0 })
                  }
                  placeholder="20"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <LabeledInput
                  label="Quantity"
                  value={formData.qty?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, qty: parseFloat(text) || 1 })
                  }
                  placeholder="1"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.unitSelector}>
                  {(["Stk", "Std", "Tag", "Monat", "Pauschal"] as UnitType[]).map(
                    (unitOption) => (
                      <TouchableOpacity
                        key={unitOption}
                        style={[
                          styles.unitButton,
                          formData.unit === unitOption &&
                            styles.unitButtonActive,
                        ]}
                        onPress={() =>
                          setFormData({ ...formData, unit: unitOption })
                        }
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            formData.unit === unitOption &&
                              styles.unitButtonTextActive,
                          ]}
                        >
                          {unitOption}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>

            <LabeledInput
              label="Discount (%)"
              value={formData.discountPct?.toString() || ""}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  discountPct: parseFloat(text) || undefined,
                })
              }
              placeholder="0"
              keyboardType="decimal-pad"
            />

            <ButtonPrimary
              title={editingItem ? "Save Changes" : "Add Item"}
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
  card: {
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
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  price: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0F766E",
  },
  taxBadge: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#1E40AF",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 8,
  },
  unitSelector: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  unitButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },
  unitButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  unitButtonTextActive: {
    color: "#0F766E",
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  inputWithAI: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  aiButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
});
