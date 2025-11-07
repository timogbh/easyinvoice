import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Switch, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { ChevronRight, ChevronDown, FileText, Shield, Trash2, Download, Edit, X, Building2, Calculator, Sparkles, Lock, Crown, Palette, Upload, Trash, Check } from "lucide-react-native";
import { useUserStore } from "@/state/userStore";
import { useDataStore } from "@/state/dataStore";
import { usePlanStore } from "@/state/planStore";
import { LabeledInput } from "@/components/LabeledInput";
import { ButtonPrimary } from "@/components/ButtonPrimary";
import { CountryPicker } from "@/components/CountryPicker";
import { validateCompany } from "@/services/validators";
import { clearAllData } from "@/services/storage";
import type { CompanyProfile, CountryCode, CurrencyCode, Language, ToneType } from "@/types";

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const setBranding = useUserStore((state) => state.setBranding);
  const removeLogo = useUserStore((state) => state.removeLogo);
  const reset = useUserStore((state) => state.reset);
  const resetData = useDataStore((state) => state.reset);
  const resetPlan = usePlanStore((state) => state.reset);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>("company");
  const [hue, setHue] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(100);
  const [lightness, setLightness] = useState<number>(50);

  React.useEffect(() => {
    if (profile?.brandColor) {
      const hex = profile.brandColor;
      const rgb = hexToRgb(hex);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
      }
    }
  }, [profile?.brandColor]);

  const hexToRgb = (hex: string) => {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return toHex(r) + toHex(g) + toHex(b);
  };

  const currentColor = hslToHex(hue, saturation, lightness);

  const aiSettings = useUserStore((state) => state.aiSettings);
  const setAISettings = useUserStore((state) => state.setAISettings);
  const aiCounters = usePlanStore((state) => state.aiCounters);
  const resetAICounters = usePlanStore((state) => state.resetAICounters);

  const handleExportData = () => {
    router.push("/account-data" as never);
  };

  const handleDeleteData = async () => {
    Alert.alert(
      "Alle Daten löschen",
      "Dies wird alle Ihre Daten dauerhaft löschen. Diese Aktion kann nicht rückgängig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all storage
              await clearAllData();
              
              // Reset all stores
              reset();
              resetData();
              resetPlan();
              
              Alert.alert("Erfolg", "Alle Daten wurden gelöscht. Die App wird neu gestartet.", [
                {
                  text: "OK",
                  onPress: () => {
                    // Force app restart by navigating to onboarding
                    router.replace("/onboarding" as never);
                  },
                },
              ]);
            } catch (error) {
              console.error("[Settings] Error deleting data:", error);
              Alert.alert("Fehler", "Beim Löschen der Daten ist ein Fehler aufgetreten.");
            }
          },
        },
      ]
    );
  };

  const handleLegal = () => {
    router.push("/legal" as never);
  };

  const handleUpgrade = () => {
    router.push("/paywall" as never);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleResetAICounters = () => {
    Alert.alert(
      "Reset AI Counters",
      "Are you sure you want to reset AI usage counters?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetAICounters();
            Alert.alert("Success", "AI counters have been reset");
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (profile) {
      setFormData(profile);
    }
    setErrors([]);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const validationErrors = validateCompany(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (profile) {
      await setProfile(formData);
      setEditModalVisible(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!profile?.premium) {
      Alert.alert("Premium erforderlich", "Logo Upload ist nur in Premium verfügbar.", [
        { text: "OK" },
        { text: "Upgrade", onPress: handleUpgrade },
      ]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`;
      console.log("[Settings] Logo uploaded, size:", base64Image.length);

      if (base64Image.length > 300000) {
        Alert.alert("Fehler", "Bild ist zu groß. Maximal 300 KB erlaubt.");
        return;
      }

      await setBranding(base64Image, profile?.brandColor);
      Alert.alert("Erfolg", "Logo wurde hochgeladen!");
    }
  };

  const handleLogoRemove = async () => {
    Alert.alert("Logo entfernen", "Möchten Sie das Logo wirklich entfernen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Entfernen",
        style: "destructive",
        onPress: async () => {
          await removeLogo();
          Alert.alert("Erfolg", "Logo wurde entfernt!");
        },
      },
    ]);
  };

  const handleBrandColorSave = async () => {
    if (!profile?.premium) {
      Alert.alert("Premium erforderlich", "Brandfarbe ist nur in Premium verfügbar.", [
        { text: "OK" },
        { text: "Upgrade", onPress: handleUpgrade },
      ]);
      return;
    }

    await setBranding(profile?.logoUrl, currentColor);
    Alert.alert("Erfolg", "Brandfarbe wurde gespeichert!");
  };

  const handleOpenTemplates = () => {
    router.push({
      pathname: "/templates",
      params: {
        currentTemplate: profile?.defaultTemplate || "modern",
      },
    } as never);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Company Data Section */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("company")}
        >
          <View style={styles.sectionHeaderLeft}>
            <Building2 size={22} color="#0F766E" />
            <Text style={styles.sectionHeaderTitle}>Company Data</Text>
          </View>
          {expandedSection === "company" ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronRight size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {expandedSection === "company" && (
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingRow} onPress={handleEditProfile}>
              <View>
                <Text style={styles.settingLabel}>Company Profile</Text>
                <Text style={styles.settingValue}>{profile?.displayName || "—"}</Text>
              </View>
              <Edit size={18} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingValue}>{profile?.currency || "EUR"}</Text>
              </View>
            </View>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Country</Text>
                <Text style={styles.settingValue}>{profile?.country || "—"}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Branding Section */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("branding")}
        >
          <View style={styles.sectionHeaderLeft}>
            <Palette size={22} color="#8B5CF6" />
            <Text style={styles.sectionHeaderTitle}>Branding & Templates</Text>
          </View>
          {expandedSection === "branding" ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronRight size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {expandedSection === "branding" && (
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLogoUpload}
              disabled={!profile?.premium}
            >
              <Upload size={20} color={profile?.premium ? "#8B5CF6" : "#D1D5DB"} />
              <View style={styles.flex1}>
                <Text
                  style={[
                    styles.actionButtonText,
                    !profile?.premium && styles.disabledText,
                  ]}
                >
                  Logo hochladen
                </Text>
                {!profile?.premium && (
                  <Text style={styles.settingHint}>Nur in Premium</Text>
                )}
              </View>
            </TouchableOpacity>
            {profile?.logoUrl && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleLogoRemove}
              >
                <Trash size={20} color="#DC2626" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                  Logo entfernen
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.brandColorSection}>
              <Text style={styles.settingLabel}>Brandfarbe</Text>
              <Text style={styles.settingHint}>Hex-Code eingeben</Text>
              
              <View style={styles.hexInputRow}>
                <View style={styles.hexInputContainer}>
                  <Text style={styles.hexPrefix}>#</Text>
                  <TextInput
                    style={[styles.hexInput, !profile?.premium && styles.disabledText]}
                    value={currentColor.toUpperCase()}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                      if (cleaned.length === 6) {
                        const rgb = hexToRgb(cleaned);
                        if (rgb) {
                          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                          setHue(hsl.h);
                          setSaturation(hsl.s);
                          setLightness(hsl.l);
                        }
                      }
                    }}
                    placeholder="000000"
                    maxLength={6}
                    autoCapitalize="characters"
                    editable={profile?.premium}
                  />
                </View>
                <View
                  style={[
                    styles.colorPreview,
                    { backgroundColor: `#${currentColor}` },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={[styles.smallButton, !profile?.premium && styles.smallButtonDisabled]}
                onPress={handleBrandColorSave}
                disabled={!profile?.premium}
              >
                <Text
                  style={[
                    styles.smallButtonText,
                    !profile?.premium && styles.disabledText,
                  ]}
                >
                  Speichern
                </Text>
              </TouchableOpacity>
              {!profile?.premium && (
                <Text style={styles.settingHint}>Nur in Premium verfügbar</Text>
              )}
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenTemplates}>
              <FileText size={20} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Template auswählen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tax Options Section */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("tax")}
        >
          <View style={styles.sectionHeaderLeft}>
            <Calculator size={22} color="#0F766E" />
            <Text style={styles.sectionHeaderTitle}>Tax Options</Text>
          </View>
          {expandedSection === "tax" ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronRight size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {expandedSection === "tax" && (
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Small Business (Kleinunternehmer)</Text>
                <Text style={styles.settingHint}>No VAT on invoices</Text>
              </View>
              <Switch
                value={profile?.smallBusinessFlag || false}
                onValueChange={(value) => {
                  setProfile({ smallBusinessFlag: value });
                }}
                trackColor={{ false: "#D1D5DB", true: "#0F766E" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Reverse Charge</Text>
                <Text style={styles.settingHint}>Automatically set for B2B EU</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* AI Settings Section */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("ai")}
        >
          <View style={styles.sectionHeaderLeft}>
            <Sparkles size={22} color="#7C3AED" />
            <Text style={styles.sectionHeaderTitle}>AI Settings</Text>
          </View>
          {expandedSection === "ai" ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronRight size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {expandedSection === "ai" && (
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Enable AI</Text>
                <Text style={styles.settingHint}>AI text generation</Text>
              </View>
              <Switch
                value={aiSettings.enabled}
                onValueChange={(value) => setAISettings({ enabled: value })}
                trackColor={{ false: "#D1D5DB", true: "#7C3AED" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.flex1}>
                <Text style={styles.settingLabel}>Language</Text>
                <View style={styles.optionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      aiSettings.language === "de" && styles.optionButtonActive,
                    ]}
                    onPress={() => setAISettings({ language: "de" })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        aiSettings.language === "de" &&
                          styles.optionButtonTextActive,
                      ]}
                    >
                      Deutsch
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      aiSettings.language === "en" && styles.optionButtonActive,
                    ]}
                    onPress={() => setAISettings({ language: "en" })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        aiSettings.language === "en" &&
                          styles.optionButtonTextActive,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.settingRow}>
              <View style={styles.flex1}>
                <Text style={styles.settingLabel}>Tone</Text>
                <View style={styles.optionButtons}>
                  {(["neutral", "formal", "casual"] as ToneType[]).map((tone) => (
                    <TouchableOpacity
                      key={tone}
                      style={[
                        styles.optionButton,
                        aiSettings.tone === tone && styles.optionButtonActive,
                      ]}
                      onPress={() => setAISettings({ tone })}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          aiSettings.tone === tone &&
                            styles.optionButtonTextActive,
                        ]}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.usageCard}>
              <Text style={styles.usageLabel}>AI Credits Used</Text>
              <Text style={styles.usageValue}>
                {profile?.premium
                  ? `${aiCounters.premiumUsed} / 300`
                  : `${aiCounters.freeUsed} / 20`}
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetAICounters}
              >
                <Text style={styles.resetButtonText}>Reset Counters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Privacy Section */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("privacy")}
        >
          <View style={styles.sectionHeaderLeft}>
            <Lock size={22} color="#0F766E" />
            <Text style={styles.sectionHeaderTitle}>Data & Privacy</Text>
          </View>
          {expandedSection === "privacy" ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronRight size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {expandedSection === "privacy" && (
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
              <Download size={20} color="#0F766E" />
              <Text style={styles.actionButtonText}>Export Data (JSON)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={handleDeleteData}
            >
              <Trash2 size={20} color="#DC2626" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                Delete All Data
              </Text>
            </TouchableOpacity>
            <View style={styles.privacyNote}>
              <Text style={styles.privacyNoteText}>
                DSGVO-compliant. All data is stored locally on your device.
              </Text>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleLegal}>
              <Shield size={20} color="#0F766E" />
              <Text style={styles.actionButtonText}>Privacy & Terms</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Premium Section */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("premium")}
        >
          <View style={styles.sectionHeaderLeft}>
            <Crown size={22} color="#F59E0B" />
            <Text style={styles.sectionHeaderTitle}>Subscription & Premium</Text>
          </View>
          {expandedSection === "premium" ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronRight size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {expandedSection === "premium" && (
          <View style={styles.sectionContent}>
            <View style={styles.planCard}>
              <Text style={styles.planLabel}>Current Plan</Text>
              <Text style={styles.planValue}>
                {profile?.premium ? "Premium" : "Free"}
              </Text>
              {!profile?.premium && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>
              )}
            </View>
            {profile?.premium && (
              <View style={styles.premiumFeatures}>
                <Text style={styles.featureItem}>✓ Unlimited documents</Text>
                <Text style={styles.featureItem}>✓ 300 AI requests/month</Text>
                <Text style={styles.featureItem}>✓ Custom branding</Text>
                <Text style={styles.featureItem}>✓ Priority support</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={styles.version}>EasyInvoice AI v1.0.0</Text>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Company Profile</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
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
              label="Company Name"
              value={formData.displayName || ""}
              onChangeText={(text) => setFormData({ ...formData, displayName: text })}
              placeholder="My Company"
              required
            />

            <LabeledInput
              label="Legal Name"
              value={formData.legalName || ""}
              onChangeText={(text) => setFormData({ ...formData, legalName: text })}
              placeholder="My Company GmbH"
            />

            <LabeledInput
              label="Email"
              value={formData.email || ""}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="office@company.com"
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
              onChangeText={(text) => setFormData({ ...formData, taxNumber: text })}
              placeholder="123/4567"
            />

            <LabeledInput
              label="IBAN (optional)"
              value={formData.iban || ""}
              onChangeText={(text) => setFormData({ ...formData, iban: text })}
              placeholder="AT123456789012345678"
              autoCapitalize="characters"
            />

            <LabeledInput
              label="BIC (optional)"
              value={formData.bic || ""}
              onChangeText={(text) => setFormData({ ...formData, bic: text })}
              placeholder="BKAUATWW"
              autoCapitalize="characters"
            />

            <LabeledInput
              label="Website (optional)"
              value={formData.website || ""}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder="https://www.company.com"
              keyboardType="url"
              autoCapitalize="none"
            />

            <LabeledInput
              label="Currency"
              value={formData.currency || ""}
              onChangeText={(text) => setFormData({ ...formData, currency: text as CurrencyCode })}
              placeholder="EUR"
              required
            />

            <LabeledInput
              label="Language"
              value={formData.language || ""}
              onChangeText={(text) => setFormData({ ...formData, language: text as Language })}
              placeholder="de or en"
            />

            <View style={styles.checkboxSection}>
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, smallBusinessFlag: !formData.smallBusinessFlag })}
              >
                <View style={[styles.checkbox, formData.smallBusinessFlag && styles.checkboxChecked]}>
                  {formData.smallBusinessFlag && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.checkboxLabel}>
                  <Text style={styles.checkboxText}>Small Business (Kleinunternehmer)</Text>
                  <Text style={styles.checkboxSubtext}>No VAT on invoices</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ButtonPrimary
              title="Save Changes"
              onPress={handleSaveProfile}
              style={styles.saveButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  collapsibleSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  sectionHeaderLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#111827",
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  settingRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#111827",
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  settingHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
  optionButtons: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionButtonActive: {
    backgroundColor: "#F0FDFA",
    borderColor: "#0F766E",
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  optionButtonTextActive: {
    color: "#0F766E",
    fontWeight: "600" as const,
  },
  usageCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  usageLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#7C3AED",
    marginBottom: 12,
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "flex-start" as const,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  actionButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#111827",
  },
  actionButtonDanger: {
    backgroundColor: "#FEF2F2",
  },
  actionButtonTextDanger: {
    color: "#DC2626",
  },
  privacyNote: {
    padding: 16,
    backgroundColor: "#F0FDFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  privacyNoteText: {
    fontSize: 13,
    color: "#0F766E",
    lineHeight: 18,
  },
  planCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  planLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  planValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  premiumFeatures: {
    padding: 16,
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
  },
  menuItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  menuLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500" as const,
  },
  dangerText: {
    color: "#DC2626",
  },
  version: {
    textAlign: "center" as const,
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 24,
    marginBottom: 32,
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
  checkboxSection: {
    marginVertical: 8,
  },
  checkboxRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#111827",
  },
  checkboxSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  disabledText: {
    color: "#D1D5DB",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 6,
    alignSelf: "flex-start" as const,
    marginBottom: 8,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  smallButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  brandColorSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  colorPreviewContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  colorPreviewLarge: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorInfoContainer: {
    flex: 1,
    gap: 4,
  },
  colorPreviewText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
    letterSpacing: 1,
  },
  colorHslText: {
    fontSize: 14,
    color: "#6B7280",
  },
  colorPickerSection: {
    marginBottom: 20,
    gap: 16,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderLabelRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#374151",
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#8B5CF6",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  hexInputRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  hexInputContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  hexPrefix: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginRight: 4,
  },
  hexInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#111827",
    paddingVertical: 12,
    fontFamily: "monospace",
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
