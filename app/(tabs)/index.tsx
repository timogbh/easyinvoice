import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, FileText, Users, Package, Crown, Eye, TrendingUp } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import { useDataStore } from "@/state/dataStore";
import { usePlanStore } from "@/state/planStore";
import type { MonthlyStats } from "@/types";

export default function DashboardScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const documents = useDataStore((state) => state.documents);
  const clients = useDataStore((state) => state.clients);
  const items = useDataStore((state) => state.items);
  const counters = usePlanStore((state) => state.counters);
  const getRemainingDocs = usePlanStore((state) => state.getRemainingDocs);
  const getRemainingAI = usePlanStore((state) => state.getRemainingAI);

  const handleUpgrade = () => {
    router.push("/paywall" as never);
  };

  const recentDocs = documents.slice(-5).reverse();

  const getMonthlyStats = (): MonthlyStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthDocs = documents.filter((doc) => {
      const docDate = new Date(doc.dateISO);
      return (
        docDate.getMonth() === currentMonth &&
        docDate.getFullYear() === currentYear &&
        doc.type === "INVOICE"
      );
    });

    const totalRevenue = currentMonthDocs.reduce(
      (sum, doc) => sum + doc.totalGross,
      0
    );

    const invoiceCount = currentMonthDocs.length;
    const quoteCount = documents.filter((doc) => {
      const docDate = new Date(doc.dateISO);
      return (
        docDate.getMonth() === currentMonth &&
        docDate.getFullYear() === currentYear &&
        doc.type === "QUOTE"
      );
    }).length;

    return { totalRevenue, invoiceCount, quoteCount };
  };

  const monthlyStats = getMonthlyStats();

  const handlePreviewDoc = (docId: string) => {
    console.log("Preview document:", docId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.companyName}>{profile?.displayName || "User"}</Text>
        </View>
        {!profile?.premium && (
          <TouchableOpacity style={styles.premiumBadge} onPress={handleUpgrade}>
            <Crown size={16} color="#F59E0B" />
            <Text style={styles.premiumBadgeText}>Free</Text>
          </TouchableOpacity>
        )}
      </View>

      {!profile?.premium && (
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Free Plan</Text>
          <Text style={styles.limitText}>
            Dokumente: {counters.freeDocsUsed}/3 diesen Monat
          </Text>
          <Text style={styles.limitText}>
            KI Texte: {getRemainingAI(false)} verbleibend (5/Monat)
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Crown size={16} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      )}

      {profile?.premium && (
        <View style={[styles.limitCard, styles.premiumCard]}>
          <View style={styles.premiumHeader}>
            <Crown size={20} color="#F59E0B" />
            <Text style={styles.premiumTitle}>Premium Active</Text>
          </View>
          <Text style={styles.premiumText}>Unbegrenzte Dokumente • 300 KI Texte/Monat</Text>
        </View>
      )}

      <View style={styles.monthlyStats}>
        <View style={styles.statsHeader}>
          <TrendingUp size={20} color="#0F766E" />
          <Text style={styles.statsTitle}>This Month</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Revenue</Text>
            <Text style={styles.statBoxValue}>
              {profile?.currency || "EUR"} {monthlyStats.totalRevenue.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Invoices</Text>
            <Text style={styles.statBoxValue}>{monthlyStats.invoiceCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Quotes</Text>
            <Text style={styles.statBoxValue}>{monthlyStats.quoteCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/invoice-editor" as never)}
          >
            <View style={styles.actionIcon}>
              <Plus size={24} color="#0F766E" />
            </View>
            <Text style={styles.actionText}>New Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push("/quote-editor" as never)}
          >
            <View style={styles.actionIcon}>
              <FileText size={24} color="#0F766E" />
            </View>
            <Text style={styles.actionText}>New Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/clients" as never)}
          >
            <View style={styles.actionIcon}>
              <Users size={24} color="#0F766E" />
            </View>
            <Text style={styles.actionText}>Add Client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/items" as never)}
          >
            <View style={styles.actionIcon}>
              <Package size={24} color="#0F766E" />
            </View>
            <Text style={styles.actionText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{clients.length}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{documents.length}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
      </View>

      {recentDocs.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {recentDocs.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docCardLeft}>
                <View>
                  <Text style={styles.docNumber}>{doc.number}</Text>
                  <Text style={styles.docClient}>{doc.client.name}</Text>
                  <Text style={styles.docDate}>
                    {new Date(doc.dateISO).toLocaleDateString("de-DE")}
                  </Text>
                </View>
              </View>
              <View style={styles.docCardRight}>
                <Text style={styles.docAmount}>
                  {doc.currency} {doc.totalGross.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => handlePreviewDoc(doc.id)}
                >
                  <Eye size={16} color="#FFFFFF" />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    paddingTop: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
  },
  companyName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#92400E",
  },
  limitCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E40AF",
    marginBottom: 4,
  },
  limitText: {
    fontSize: 14,
    color: "#1E40AF",
    marginBottom: 12,
  },
  upgradeButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "#1E40AF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start" as const,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  premiumCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
    borderWidth: 2,
  },
  premiumHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#92400E",
  },
  premiumText: {
    fontSize: 14,
    color: "#78350F",
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    justifyContent: "space-between" as const,
    rowGap: 12,
  },
  actionCard: {
    width: "48%" as const,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0FDFA",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
    textAlign: "center" as const,
  },
  stats: {
    flexDirection: "row" as const,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#0F766E",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 16,
  },
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  docCardLeft: {
    flex: 1,
  },
  docCardRight: {
    alignItems: "flex-end" as const,
    gap: 8,
  },
  docNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  docClient: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  docAmount: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#0F766E",
  },
  docDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  previewButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#0F766E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  monthlyStats: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  statsGrid: {
    flexDirection: "row" as const,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center" as const,
  },
  statBoxLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500" as const,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#0F766E",
    textAlign: "center" as const,
  },
  spacer: {
    height: 32,
  },
});