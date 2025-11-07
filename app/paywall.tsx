import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Crown, Check } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import { getOfferings, purchasePackage, restorePurchases, getEntitlements } from "@/services/revenuecat";
import { logEvent, AnalyticsEvents } from "@/services/analytics";

export default function PaywallScreen() {
  const router = useRouter();
  const setPremium = useUserStore((state) => state.setPremium);

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async (packageId: "monthly" | "annual") => {
    setLoading(true);
    logEvent(AnalyticsEvents.PURCHASE_START, { packageId });

    try {
      const success = await purchasePackage(packageId);
      
      if (success) {
        // Sync premium status from RevenueCat
        const entitlements = await getEntitlements();
        await setPremium(entitlements.premium);
        
        logEvent(AnalyticsEvents.PURCHASE_SUCCESS, { packageId });
        Alert.alert(
          "Erfolg!",
          "Premium wurde aktiviert! Sie haben jetzt unbegrenzten Zugriff.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        logEvent(AnalyticsEvents.PURCHASE_CANCEL);
        Alert.alert("Purchase Failed", "The purchase could not be completed. Please try again.");
      }
    } catch (error) {
      console.error("[Paywall] Purchase error:", error);
      Alert.alert("Error", "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);

    try {
      const success = await restorePurchases();
      
      if (success) {
        // Sync premium status from RevenueCat
        const entitlements = await getEntitlements();
        await setPremium(entitlements.premium);
        
        Alert.alert(
          "Erfolg!",
          "Käufe wurden wiederhergestellt! Premium wurde aktiviert.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert("No Purchases Found", "No previous purchases were found.");
      }
    } catch (error) {
      console.error("[Paywall] Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const freePlanFeatures = [
    "3 Dokumente pro Monat",
    "5 KI Texte pro Monat",
    "1 Standard PDF Template",
    "Keine Analytics",
  ];

  const premiumFeatures = [
    "Unbegrenzte Rechnungen und Angebote",
    "300 KI Texte pro Monat",
    "3 PDF Templates und Branding (Logo und Farbe)",
    "Analytics mit Monatsumsatz und Top Kunden",
    "ZIP Export aller PDFs",
    "Priorisierte Updates",
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
        <X size={28} color="#111827" />
      </TouchableOpacity>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Crown size={64} color="#F59E0B" />
          <Text style={styles.title}>EasyInvoice AI Premium</Text>
          <Text style={styles.subtitle}>
            Erstelle unbegrenzt Rechnungen, nutze KI ohne Limit und erhalte professionelle PDF Designs.
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <View style={styles.planCard}>
            <Text style={styles.planBadge}>KOSTENLOS</Text>
            <Text style={styles.planTitle}>Free Plan</Text>
            <Text style={styles.planPrice}>0,00 €</Text>
            
            <View style={styles.featuresList}>
              {freePlanFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Check size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.premiumBadge}>
              <Crown size={16} color="#FFFFFF" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            <Text style={styles.planTitle}>Premium Plan</Text>
            
            <View style={styles.featuresList}>
              {premiumFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureIcon, styles.featureIconPremium]}>
                    <Check size={16} color="#F59E0B" />
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <TouchableOpacity
            style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
            onPress={() => handlePurchase("monthly")}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.purchaseContent}>
                  <Text style={styles.purchaseTitle}>Monatlich</Text>
                  <Text style={styles.purchasePrice}>9,99 €/Monat</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.purchaseButton, styles.purchaseButtonAnnual, loading && styles.purchaseButtonDisabled]}
            onPress={() => handlePurchase("annual")}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Spare 17%</Text>
                </View>
                <View style={styles.purchaseContent}>
                  <Text style={styles.purchaseTitle}>Jährlich</Text>
                  <Text style={styles.purchasePrice}>59,99 €/Jahr</Text>
                  <Text style={styles.purchaseSubtext}>4,99 €/Monat</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color="#0F766E" />
          ) : (
            <Text style={styles.restoreButtonText}>Käufe wiederherstellen</Text>
          )}
        </TouchableOpacity>

        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            Abos können in Apple oder Google Kontoeinstellungen verwaltet und gekündigt werden.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  closeButton: {
    position: "absolute" as const,
    top: 8,
    right: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  heroSection: {
    alignItems: "center" as const,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 16,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center" as const,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  premiumCard: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  planBadge: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    alignSelf: "flex-start" as const,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#0F766E",
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 2,
  },
  featureIconPremium: {
    backgroundColor: "#FEF3C7",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  pricingSection: {
    gap: 12,
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: "#0F766E",
    borderRadius: 12,
    padding: 20,
    alignItems: "center" as const,
    position: "relative" as const,
  },
  purchaseButtonAnnual: {
    backgroundColor: "#F59E0B",
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  saveBadge: {
    position: "absolute" as const,
    top: -8,
    right: 16,
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  purchaseContent: {
    alignItems: "center" as const,
  },
  purchaseTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  purchasePrice: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  purchaseSubtext: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 4,
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: "center" as const,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#0F766E",
  },
  legalSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  legalText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center" as const,
    lineHeight: 20,
  },
});
