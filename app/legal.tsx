import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LegalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.text}>
            EasyInvoice AI respects your privacy and is committed to protecting your personal data. All data is stored locally on your device.
          </Text>
          <Text style={styles.text}>
            We collect minimal information necessary for the app's functionality. Your invoice data, client information, and company details remain on your device unless you explicitly export them.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.text}>
            By using EasyInvoice AI, you agree to use the app in compliance with all applicable laws and regulations.
          </Text>
          <Text style={styles.text}>
            The app is provided "as is" without warranties. EasyInvoice AI is a tool to help create invoices; it does not provide legal or tax advice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Disclaimer</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Important:</Text> This app provides invoice templates without warranty. It does not constitute tax or legal advice.
          </Text>
          <Text style={styles.text}>
            Tax regulations vary by country and change frequently. Always consult with a qualified tax advisor or accountant for your specific situation.
          </Text>
          <Text style={styles.text}>
            EasyInvoice AI is not liable for any errors, omissions, or consequences arising from the use of generated documents.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>GDPR Compliance</Text>
          <Text style={styles.text}>
            We comply with GDPR requirements:
          </Text>
          <Text style={styles.text}>• Data minimization - we only collect necessary information</Text>
          <Text style={styles.text}>• Right to access - export your data anytime</Text>
          <Text style={styles.text}>• Right to deletion - delete all data from Settings</Text>
          <Text style={styles.text}>• Data portability - export in JSON format</Text>
          <Text style={styles.text}>• Consent - required during onboarding</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Contact</Text>
          <Text style={styles.text}>
            For questions or concerns about privacy or the app:
          </Text>
          <Text style={styles.text}>Email: support@easyinvoice.app</Text>
        </View>

        <Text style={styles.version}>Version 1.0.0 • Last updated: {new Date().toLocaleDateString()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "600" as const,
  },
  version: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center" as const,
    marginTop: 16,
    marginBottom: 32,
  },
});
