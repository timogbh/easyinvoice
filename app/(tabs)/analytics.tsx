import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Crown, TrendingUp, Users, Package } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import { useDataStore } from "@/state/dataStore";


export default function AnalyticsScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const documents = useDataStore((state) => state.documents);
  const items = useDataStore((state) => state.items);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!profile?.premium) {
      router.push("/paywall" as never);
    }
  }, [profile?.premium, router]);

  const years = useMemo(() => {
    const allYears = documents.map((doc) => new Date(doc.dateISO).getFullYear());
    const uniqueYears = Array.from(new Set(allYears)).sort((a, b) => b - a);
    if (uniqueYears.length === 0) {
      uniqueYears.push(new Date().getFullYear());
    }
    return uniqueYears;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const docYear = new Date(doc.dateISO).getFullYear();
      return docYear === selectedYear && doc.type === "INVOICE";
    });
  }, [documents, selectedYear]);

  const monthlyRevenue = useMemo(() => {
    const revenue: Record<string, number> = {};
    filteredDocs.forEach((doc) => {
      const month = new Date(doc.dateISO).toLocaleString("en", { month: "short" });
      revenue[month] = (revenue[month] || 0) + doc.totalGross;
    });
    return revenue;
  }, [filteredDocs]);

  const topClients = useMemo(() => {
    const clientRevenue: Record<string, { name: string; total: number }> = {};
    filteredDocs.forEach((doc) => {
      const clientId = doc.client.id;
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = { name: doc.client.name, total: 0 };
      }
      clientRevenue[clientId].total += doc.totalGross;
    });
    return Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredDocs]);

  const topItems = useMemo(() => {
    const itemCount: Record<string, { title: string; count: number }> = {};
    filteredDocs.forEach((doc) => {
      doc.lines.forEach((line) => {
        if (line.itemId) {
          const item = items.find((i) => i.id === line.itemId);
          if (item) {
            if (!itemCount[item.id]) {
              itemCount[item.id] = { title: item.title, count: 0 };
            }
            itemCount[item.id].count += line.qty;
          }
        }
      });
    });
    return Object.values(itemCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredDocs, items]);

  const totalRevenue = filteredDocs.reduce((sum, doc) => sum + doc.totalGross, 0);
  const invoiceCount = filteredDocs.length;
  const avgInvoice = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

  if (!profile?.premium) {
    return (
      <View style={styles.premiumContainer}>
        <Crown size={64} color="#F59E0B" />
        <Text style={styles.premiumTitle}>Premium Feature</Text>
        <Text style={styles.premiumText}>
          Upgrade to Premium to access Analytics and gain insights into your business.
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push("/paywall" as never)}
        >
          <Crown size={20} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: profile.currency || "EUR",
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.yearSelector}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonActive,
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#0F766E" />
          <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{invoiceCount}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(avgInvoice)}</Text>
          <Text style={styles.statLabel}>Avg Invoice</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Revenue</Text>
        <View style={styles.chartContainer}>
          {Object.entries(monthlyRevenue).length > 0 ? (
            Object.entries(monthlyRevenue).map(([month, revenue]) => {
              const maxRevenue = Math.max(...Object.values(monthlyRevenue));
              const barHeight = maxRevenue > 0 ? (revenue / maxRevenue) * 150 : 0;
              return (
                <View key={month} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: barHeight }]} />
                  </View>
                  <Text style={styles.barLabel}>{month}</Text>
                  <Text style={styles.barValue}>
                    {formatCurrency(revenue)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No data for this year</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users size={20} color="#0F766E" />
          <Text style={styles.sectionTitle}>Top 5 Clients</Text>
        </View>
        {topClients.length > 0 ? (
          topClients.map((client, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.rankBadge}>{index + 1}</Text>
                <Text style={styles.listItemText}>{client.name}</Text>
              </View>
              <Text style={styles.listItemValue}>
                {formatCurrency(client.total)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#0F766E" />
          <Text style={styles.sectionTitle}>Top 5 Items</Text>
        </View>
        {topItems.length > 0 ? (
          topItems.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.rankBadge}>{index + 1}</Text>
                <Text style={styles.listItemText}>{item.title}</Text>
              </View>
              <Text style={styles.listItemValue}>{item.count}x</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No data available</Text>
        )}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  premiumContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
  },
  premiumText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center" as const,
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 16,
  },
  yearSelector: {
    flexDirection: "row" as const,
    gap: 8,
  },
  yearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  yearButtonActive: {
    borderColor: "#0F766E",
    backgroundColor: "#F0FDFA",
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  yearButtonTextActive: {
    color: "#0F766E",
  },
  statsRow: {
    flexDirection: "row" as const,
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#0F766E",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center" as const,
  },
  section: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
  },
  chartContainer: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    alignItems: "flex-end" as const,
    marginTop: 16,
    minHeight: 200,
  },
  barWrapper: {
    alignItems: "center" as const,
    flex: 1,
  },
  barContainer: {
    height: 150,
    justifyContent: "flex-end" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  bar: {
    width: 40,
    backgroundColor: "#0F766E",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  listItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listItemLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0FDFA",
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    lineHeight: 28,
  },
  listItemText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#0F766E",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center" as const,
    paddingVertical: 20,
  },
  spacer: {
    height: 32,
  },
});
