import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CheckSquare, Square } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import type { CompanyProfile, CountryCode, CurrencyCode } from "@/types";
import { ButtonPrimary } from "@/components/ButtonPrimary";
import { LabeledInput } from "@/components/LabeledInput";
import { CountryPicker } from "@/components/CountryPicker";
import { validateCompany } from "@/services/validators";
import { logEvent, AnalyticsEvents } from "@/services/analytics";

export default function OnboardingScreen() {
  const router = useRouter();
  const setProfile = useUserStore((state) => state.setProfile);

  const [step, setStep] = useState(1);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    displayName: "",
    country: "AT" as CountryCode,
    currency: "EUR" as CurrencyCode,
    language: "de",
    premium: false,
    smallBusinessFlag: false,
    businessTypeDefault: "B2C",
    numbering: {
      invoicePrefix: "RE-",
      invoiceNext: 1,
      quotePrefix: "AN-",
      quoteNext: 1,
    },
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleConsent = () => {
    if (!consentAccepted) {
      alert("Please accept the privacy policy to continue");
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    const validationErrors = validateCompany(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const profile: CompanyProfile = {
      id: Date.now().toString(),
      displayName: formData.displayName || "",
      legalName: formData.legalName,
      email: formData.email,
      phone: formData.phone,
      street: formData.street,
      zip: formData.zip,
      city: formData.city,
      country: formData.country || ("AT" as CountryCode),
      vatId: formData.vatId,
      taxNumber: formData.taxNumber,
      iban: formData.iban,
      bic: formData.bic,
      website: formData.website,
      currency: formData.currency || ("EUR" as CurrencyCode),
      language: formData.language || "de",
      numbering: formData.numbering || {
        invoicePrefix: "RE-",
        invoiceNext: 1,
        quotePrefix: "AN-",
        quoteNext: 1,
      },
      premium: false,
      smallBusinessFlag: formData.smallBusinessFlag,
      businessTypeDefault: formData.businessTypeDefault || "B2C",
      consentISO: new Date().toISOString(),
      defaultTemplate: "modern",
    };

    console.log("[Onboarding] Setting profile:", profile);
    await setProfile(profile);
    
    console.log("[Onboarding] Logging events");
    logEvent(AnalyticsEvents.ONBOARDING_COMPLETE);
    logEvent(AnalyticsEvents.CONSENT_ACCEPTED);

    console.log("[Onboarding] Navigating to tabs");
    router.replace("/(tabs)" as never);
  };

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Welcome to EasyInvoice AI</Text>
            <Text style={styles.subtitle}>
              Create professional invoices and quotes with multi-country tax compliance
            </Text>

            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Features</Text>
              <Text style={styles.feature}>• Multi-country tax engine (AT/DE/CH/EU)</Text>
              <Text style={styles.feature}>• Reverse-Charge & Small Business support</Text>
              <Text style={styles.feature}>• AI-powered text suggestions</Text>
              <Text style={styles.feature}>• PDF export & sharing</Text>
              <Text style={styles.feature}>• GDPR compliant</Text>
            </View>

            <View style={styles.consentBox}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setConsentAccepted(!consentAccepted)}
              >
                {consentAccepted ? (
                  <CheckSquare size={24} color="#0F766E" />
                ) : (
                  <Square size={24} color="#9CA3AF" />
                )}
              </TouchableOpacity>
              <Text style={styles.consentText}>
                I accept the{" "}
                <Text style={styles.link} onPress={() => router.push("/legal" as never)}>
                  Privacy Policy & Terms
                </Text>
              </Text>
            </View>

            <ButtonPrimary
              title="Continue"
              onPress={handleConsent}
              disabled={!consentAccepted}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Company Information</Text>
          <Text style={styles.subtitle}>
            Set up your company profile to get started
          </Text>

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
            label="Company Name"
            value={formData.displayName || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, displayName: text })
            }
            placeholder="ABC Company GmbH"
            required
          />

          <LabeledInput
            label="Legal Name (optional)"
            value={formData.legalName || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, legalName: text })
            }
            placeholder="ABC Company Gesellschaft mit beschränkter Haftung"
          />

          <LabeledInput
            label="Email"
            value={formData.email || ""}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="office@example.com"
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
            required
          />

          <LabeledInput
            label="VAT ID (optional)"
            value={formData.vatId || ""}
            onChangeText={(text) => setFormData({ ...formData, vatId: text })}
            placeholder="ATU12345678"
          />

          <LabeledInput
            label="Tax Number (optional)"
            value={formData.taxNumber || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, taxNumber: text })
            }
            placeholder="123/4567"
          />

          <LabeledInput
            label="IBAN (optional)"
            value={formData.iban || ""}
            onChangeText={(text) => setFormData({ ...formData, iban: text })}
            placeholder="AT611904300234573201"
          />

          <LabeledInput
            label="BIC (optional)"
            value={formData.bic || ""}
            onChangeText={(text) => setFormData({ ...formData, bic: text })}
            placeholder="BKAUATWW"
          />

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() =>
              setFormData({
                ...formData,
                smallBusinessFlag: !formData.smallBusinessFlag,
              })
            }
          >
            {formData.smallBusinessFlag ? (
              <CheckSquare size={24} color="#0F766E" />
            ) : (
              <Square size={24} color="#9CA3AF" />
            )}
            <Text style={styles.checkboxLabel}>
              Small business (Kleinunternehmerregelung)
            </Text>
          </TouchableOpacity>

          <ButtonPrimary
            title="Complete Setup"
            onPress={handleComplete}
            style={styles.completeButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    lineHeight: 24,
  },
  features: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  consentBox: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },
  consentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  link: {
    color: "#0F766E",
    textDecorationLine: "underline" as const,
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
  completeButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});
