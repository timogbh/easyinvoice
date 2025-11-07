import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { TemplateMeta } from "@/types";

interface TemplateCardProps {
  meta: TemplateMeta;
  selected: boolean;
  premiumRequired: boolean;
  isPremium: boolean;
  logoUrl?: string;
  brandColor?: string;
  onPress: () => void;
}

export default function TemplateCard({
  meta,
  selected,
  premiumRequired,
  isPremium,
  logoUrl,
  brandColor,
  onPress,
}: TemplateCardProps) {
  const effectiveBrandColor = brandColor ? `#${brandColor}` : "#0F766E";
  const isDisabled = premiumRequired && !isPremium;

  const renderModernTemplate = () => (
    <View style={styles.preview}>
      <View style={styles.modernHeader}>
        {meta.supportsLogo && logoUrl && (
          <View style={[styles.modernLogo, { backgroundColor: effectiveBrandColor + "20" }]}>
            <Text style={[styles.modernLogoText, { color: effectiveBrandColor }]}>LOGO</Text>
          </View>
        )}
        <View style={styles.modernHeaderRight}>
          <Text style={[styles.modernTitle, { color: effectiveBrandColor }]}>INVOICE</Text>
          <Text style={styles.modernNumber}>#2025-001</Text>
        </View>
      </View>

      <View style={styles.modernAddresses}>
        <View style={styles.modernAddress} />
        <View style={styles.modernAddress} />
      </View>

      <View style={[styles.modernTableHeader, { backgroundColor: effectiveBrandColor + "15" }]}>
        <View style={styles.modernTableHeaderRow} />
      </View>

      <View style={styles.modernTable}>
        <View style={[styles.modernTableRow, { backgroundColor: "#F9FAFB" }]} />
        <View style={styles.modernTableRow} />
        <View style={[styles.modernTableRow, { backgroundColor: "#F9FAFB" }]} />
      </View>

      <View style={styles.modernTotal}>
        <View style={[styles.modernTotalBox, { borderTopColor: effectiveBrandColor }]}>
          <View style={styles.modernTotalLine} />
          <View style={styles.modernTotalLine} />
          <View style={[styles.modernTotalLine, { height: 4 }]} />
        </View>
      </View>
    </View>
  );

  const renderClassicTemplate = () => (
    <View style={[styles.preview, styles.classicPreview]}>
      <View style={styles.classicBorder}>
        <View style={styles.classicHeader}>
          <Text style={styles.classicTitle}>INVOICE</Text>
          {meta.supportsLogo && logoUrl && (
            <View style={[styles.classicLogo, { borderColor: effectiveBrandColor }]}>
              <Text style={[styles.classicLogoText, { color: effectiveBrandColor }]}>LOGO</Text>
            </View>
          )}
        </View>

        <View style={styles.classicNumber}>
          <Text style={styles.classicNumberText}>#2025-001</Text>
        </View>

        <View style={styles.classicAddressSection}>
          <View style={styles.classicAddress} />
          <View style={styles.classicAddress} />
        </View>

        <View style={styles.classicDivider} />

        <View style={styles.classicTable}>
          <View style={[styles.classicTableRow, { borderTopWidth: 1.5 }]} />
          <View style={styles.classicTableRow} />
          <View style={styles.classicTableRow} />
          <View style={[styles.classicTableRow, { borderBottomWidth: 1.5 }]} />
        </View>

        <View style={styles.classicTotalBox}>
          <View style={[styles.classicTotalBorder, { borderColor: effectiveBrandColor }]}>
            <View style={styles.classicTotalLine} />
            <View style={styles.classicTotalLine} />
            <View style={[styles.classicTotalLine, { height: 3 }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderMinimalTemplate = () => (
    <View style={[styles.preview, styles.minimalPreview]}>
      <View style={styles.minimalHeader}>
        {meta.supportsLogo && logoUrl && (
          <View style={styles.minimalLogo}>
            <Text style={styles.minimalLogoText}>LOGO</Text>
          </View>
        )}
        <View style={styles.minimalSpacer} />
      </View>

      <View style={styles.minimalMeta}>
        <Text style={styles.minimalMetaText}>INVOICE</Text>
        <View style={[styles.minimalMetaLine, { backgroundColor: effectiveBrandColor + "30" }]} />
      </View>

      <View style={styles.minimalAddresses}>
        <View style={styles.minimalAddress} />
        <View style={styles.minimalSpacer} />
        <View style={styles.minimalAddress} />
      </View>

      <View style={styles.minimalTable}>
        <View style={[styles.minimalTableHeader, { borderBottomColor: effectiveBrandColor }]} />
        <View style={styles.minimalSpacer} />
        <View style={styles.minimalTableRow} />
        <View style={styles.minimalTableRow} />
        <View style={styles.minimalSpacer} />
      </View>

      <View style={styles.minimalTotal}>
        <View style={styles.minimalSpacer} />
        <View style={styles.minimalTotalLine} />
        <View style={styles.minimalTotalLine} />
        <View style={[styles.minimalTotalMain, { backgroundColor: effectiveBrandColor + "10" }]} />
      </View>
    </View>
  );

  const renderTemplate = () => {
    switch (meta.id) {
      case "modern":
        return renderModernTemplate();
      case "classic":
        return renderClassicTemplate();
      case "minimal":
        return renderMinimalTemplate();
      default:
        return renderModernTemplate();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        isDisabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={`template-card-${meta.id}`}
    >
      {renderTemplate()}

      <View style={styles.info}>
        <Text style={styles.name}>{meta.name}</Text>
        {premiumRequired && !isPremium && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Nur in Premium</Text>
          </View>
        )}
        {selected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ Ausgewählt</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#22C55E",
    borderWidth: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  preview: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    minHeight: 240,
  },
  info: {
    padding: 12,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#92400E",
  },
  selectedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#065F46",
  },
  modernHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modernLogo: {
    width: 50,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  modernLogoText: {
    fontSize: 7,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  modernHeaderRight: {
    alignItems: "flex-end",
  },
  modernTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 2,
  },
  modernNumber: {
    fontSize: 8,
    color: "#6B7280",
    fontWeight: "600" as const,
  },
  modernAddresses: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modernAddress: {
    width: "45%",
    height: 28,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  modernTableHeader: {
    height: 14,
    borderRadius: 4,
    marginBottom: 2,
  },
  modernTableHeaderRow: {
    height: 14,
  },
  modernTable: {
    gap: 1,
    marginBottom: 12,
  },
  modernTableRow: {
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  modernTotal: {
    alignItems: "flex-end",
  },
  modernTotalBox: {
    width: 80,
    borderTopWidth: 2,
    paddingTop: 6,
    gap: 3,
  },
  modernTotalLine: {
    height: 2,
    backgroundColor: "#D1D5DB",
    borderRadius: 1,
  },
  classicPreview: {
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  classicBorder: {
    borderWidth: 2,
    borderColor: "#374151",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  classicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 6,
  },
  classicTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#111827",
    fontFamily: "serif",
    letterSpacing: 2,
  },
  classicLogo: {
    width: 40,
    height: 16,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  classicLogoText: {
    fontSize: 6,
    fontWeight: "600" as const,
  },
  classicNumber: {
    marginBottom: 10,
  },
  classicNumberText: {
    fontSize: 7,
    color: "#6B7280",
    fontWeight: "600" as const,
  },
  classicAddressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  classicAddress: {
    width: "46%",
    height: 24,
    backgroundColor: "#F9FAFB",
    borderWidth: 0.5,
    borderColor: "#D1D5DB",
  },
  classicDivider: {
    height: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 8,
  },
  classicTable: {
    marginBottom: 10,
  },
  classicTableRow: {
    height: 8,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    borderTopColor: "#374151",
  },
  classicTotalBox: {
    alignItems: "flex-end",
  },
  classicTotalBorder: {
    width: 70,
    borderWidth: 1.5,
    padding: 6,
    gap: 3,
    backgroundColor: "#FAFAFA",
  },
  classicTotalLine: {
    height: 2,
    backgroundColor: "#D1D5DB",
  },
  minimalPreview: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  minimalHeader: {
    marginBottom: 20,
  },
  minimalLogo: {
    width: 60,
    height: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  minimalLogoText: {
    fontSize: 6,
    color: "#9CA3AF",
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  minimalSpacer: {
    height: 8,
  },
  minimalMeta: {
    marginBottom: 16,
  },
  minimalMetaText: {
    fontSize: 10,
    fontWeight: "300" as const,
    color: "#374151",
    letterSpacing: 2,
    marginBottom: 4,
  },
  minimalMetaLine: {
    height: 1,
    width: 40,
  },
  minimalAddresses: {
    marginBottom: 16,
  },
  minimalAddress: {
    height: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 2,
  },
  minimalTable: {
    marginBottom: 16,
  },
  minimalTableHeader: {
    height: 10,
    borderBottomWidth: 1,
  },
  minimalTableRow: {
    height: 6,
    backgroundColor: "#FAFAFA",
    marginVertical: 3,
  },
  minimalTotal: {
    alignItems: "flex-end",
  },
  minimalTotalLine: {
    width: 70,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginVertical: 2,
  },
  minimalTotalMain: {
    width: 70,
    height: 6,
    borderRadius: 1,
    marginTop: 4,
  },
});
