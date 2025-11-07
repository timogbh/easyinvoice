import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Search, Globe } from "lucide-react-native";
import type { CountryCode } from "@/types";
import { EU_COUNTRIES, OTHER_COUNTRIES, getCountryByCode, Country } from "@/constants/countries";

interface CountryPickerProps {
  value?: CountryCode | string;
  onSelect: (code: CountryCode) => void;
  label?: string;
  required?: boolean;
}

export function CountryPicker({ value, onSelect, label, required }: CountryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = getCountryByCode(value);

  const filteredEUCountries = useMemo(() => {
    if (!searchQuery) return EU_COUNTRIES;
    const query = searchQuery.toLowerCase();
    return EU_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredOtherCountries = useMemo(() => {
    if (!searchQuery) return OTHER_COUNTRIES;
    const query = searchQuery.toLowerCase();
    return OTHER_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (country: Country) => {
    onSelect(country.code);
    setModalVisible(false);
    setSearchQuery("");
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        item.code === value && styles.countryItemSelected,
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.countryEmoji}>{item.emoji}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        {selectedCountry ? (
          <View style={styles.selectedContent}>
            <Text style={styles.selectedEmoji}>{selectedCountry.emoji}</Text>
            <Text style={styles.selectedText}>
              {selectedCountry.name} ({selectedCountry.code})
            </Text>
          </View>
        ) : (
          <View style={styles.selectedContent}>
            <Globe size={20} color="#9CA3AF" />
            <Text style={styles.placeholder}>Select country</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            {filteredEUCountries.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>European Union</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{filteredEUCountries.length}</Text>
                  </View>
                </View>
                <FlatList
                  data={filteredEUCountries}
                  renderItem={renderCountryItem}
                  keyExtractor={(item) => item.code}
                  scrollEnabled={false}
                />
              </View>
            )}

            {filteredOtherCountries.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Other Countries</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{filteredOtherCountries.length}</Text>
                  </View>
                </View>
                <FlatList
                  data={filteredOtherCountries}
                  renderItem={renderCountryItem}
                  keyExtractor={(item) => item.code}
                  scrollEnabled={false}
                />
              </View>
            )}

            {filteredEUCountries.length === 0 && filteredOtherCountries.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No countries found</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  selector: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: "center" as const,
  },
  selectedContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  selectedEmoji: {
    fontSize: 24,
  },
  selectedText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholder: {
    fontSize: 16,
    color: "#9CA3AF",
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
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchIcon: {
    position: "absolute" as const,
    left: 28,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  modalContent: {
    flex: 1,
  },
  section: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  countryItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  countryItemSelected: {
    backgroundColor: "#F0FDFA",
  },
  countryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#111827",
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyState: {
    padding: 32,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
});
