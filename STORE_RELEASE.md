# Store Release Checklist - EasyInvoice AI

## ✅ Abgeschlossene Aufgaben

### 1. RevenueCat SDK Integration
- ✅ `react-native-purchases` SDK integriert
- ✅ Mock-Modus als Fallback implementiert
- ✅ Premium-Status wird automatisch synchronisiert
- ✅ Purchase und Restore funktionieren

**Wichtig:** Setze die Environment Variables:
- `EXPO_PUBLIC_RC_IOS` - RevenueCat iOS API Key
- `EXPO_PUBLIC_RC_ANDROID` - RevenueCat Android API Key

### 2. EAS Build Konfiguration
- ✅ `eas.json` erstellt mit Build-Profiles für development, preview und production
- ✅ iOS und Android Build-Konfigurationen vorbereitet

### 3. DSGVO Delete Funktion
- ✅ Vollständige Datenlöschung implementiert
- ✅ Alle Namespaces werden gelöscht (USER, DATA, PLAN)
- ✅ App startet nach Löschung neu (Onboarding)

### 4. Limit Checks & Paywall
- ✅ Limit-Checks beim Dokument-Export implementiert
- ✅ Paywall öffnet sich automatisch bei Limit-Erreichung
- ✅ Premium-Status wird aus RevenueCat synchronisiert

### 5. App Store Metadaten
- ✅ `app.json` für Store Submission vorbereitet
- ✅ iOS buildNumber und Android versionCode hinzugefügt
- ✅ Permission-Beschreibungen verbessert

## 📋 Noch zu erledigen

### 1. RevenueCat Setup
1. RevenueCat Account erstellen (https://www.revenuecat.com)
2. App in RevenueCat Dashboard anlegen
3. iOS und Android API Keys kopieren
4. Products/Offerings in RevenueCat konfigurieren:
   - Monthly Subscription (9,99 €)
   - Annual Subscription (59,99 €)
   - Entitlement "premium" erstellen
5. Environment Variables in `.env` oder EAS Secrets setzen

### 2. (Reserve) Weitere Verbesserungen
- Falls nötig: zusätzliche PDF-Validierung (Layouttests, mehrsprachige Inhalte)
- Optional: Logging/Monitoring für KI-Endpoint ergänzen

### 4. App Store Connect / Play Console
1. **iOS:**
   - App Store Connect Account erstellen
   - App anlegen
   - Bundle ID: `app.rork.easyinvoice-ai-ok18mns`
   - Screenshots generieren (alle Gerätegrößen)
   - App-Beschreibung, Keywords, Privacy Policy URL
   - Data Safety Informationen ausfüllen
   - App Store Review Guidelines prüfen

2. **Android:**
   - Google Play Console Account erstellen
   - App anlegen
   - Package Name: `app.rork.easyinvoice_ai_ok18mns`
   - Screenshots generieren
   - App-Beschreibung, Privacy Policy URL
   - Data Safety Informationen ausfüllen
   - Content Rating durchführen

### 5. Build & Submit
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### 6. Testing Checklist
- [ ] Onboarding funktioniert
- [ ] Dokumente erstellen (Rechnung & Angebot)
- [ ] Steuerlogik testen (AT, DE, CH, EU)
- [ ] KUR (Kleinunternehmerregelung) funktioniert
- [ ] Reverse Charge funktioniert
- [ ] PDF Export funktioniert
- [ ] Free Limits greifen (3 Docs, 5 KI)
- [ ] Paywall öffnet sich bei Limit
- [ ] Premium Purchase funktioniert
- [ ] Restore Purchases funktioniert
- [ ] Analytics Tab (nur Premium)
- [ ] Templates (Modern Free, Classic/Minimal Premium)
- [ ] Branding (Logo & Farbe nur Premium)
- [ ] DSGVO Export funktioniert
- [ ] DSGVO Delete funktioniert
- [ ] Daten werden korrekt gespeichert

## 🔧 Wichtige Konfigurationen

### Environment Variables
Erstelle eine `.env` Datei oder setze EAS Secrets:
```
EXPO_PUBLIC_RC_IOS=your_ios_key_here
EXPO_PUBLIC_RC_ANDROID=your_android_key_here
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
EXPO_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

### RevenueCat Entitlements
- Entitlement ID: `premium`
- Products: `monthly`, `annual`

### App Store Requirements
- Privacy Policy URL (muss öffentlich erreichbar sein)
- Terms of Service URL (optional)
- Support Email
- App Icon (1024x1024 PNG)
- Screenshots für alle Gerätegrößen

## 📝 Notizen

- RevenueCat funktioniert im Mock-Modus, wenn keine API Keys gesetzt sind
- Alle Daten werden lokal gespeichert (DSGVO-konform)

## 🚀 Nächste Schritte

1. RevenueCat Account einrichten und API Keys setzen
2. Test-Build erstellen (`eas build --platform ios --profile preview`)
3. Test auf echten Geräten
4. Screenshots generieren
5. App Store Connect / Play Console Einträge erstellen
6. Production Build erstellen
7. Submit zu Stores
8. Review-Prozess abwarten

