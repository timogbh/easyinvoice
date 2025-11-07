import type { Offerings, Entitlements } from "@/types";
import { Platform } from "react-native";

// RevenueCat SDK - wird nur geladen wenn verfügbar
let Purchases: any = null;
let LOG_LEVEL: any = null;

try {
  const purchasesModule = require("react-native-purchases");
  Purchases = purchasesModule.default || purchasesModule;
  LOG_LEVEL = purchasesModule.LOG_LEVEL;
} catch (error) {
  console.warn("[RevenueCat] SDK not available, using mock mode");
}

let isInitialized = false;

export async function initRevenueCat(): Promise<void> {
  if (isInitialized) {
    console.log("[RevenueCat] Already initialized");
    return;
  }

  try {
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_RC_IOS,
      android: process.env.EXPO_PUBLIC_RC_ANDROID,
    });

    if (!apiKey) {
      console.warn("[RevenueCat] API key not set, using mock mode");
      isInitialized = true;
      return;
    }

    if (!Purchases) {
      console.warn("[RevenueCat] SDK not available, using mock mode");
      isInitialized = true;
      return;
    }

    if (LOG_LEVEL) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    await Purchases.configure({ apiKey });
    
    isInitialized = true;
    console.log("[RevenueCat] Initialized successfully");
  } catch (error) {
    console.error("[RevenueCat] Initialization error:", error);
    // Fallback to mock mode if initialization fails
    isInitialized = true;
  }
}

export async function getOfferings(): Promise<Offerings> {
  try {
    if (!isInitialized || !Purchases || (!process.env.EXPO_PUBLIC_RC_IOS && !process.env.EXPO_PUBLIC_RC_ANDROID)) {
      // Mock mode
      return {
        monthly: {
          id: "monthly",
          price: "9,99 €",
        },
        annual: {
          id: "annual",
          price: "59,99 €",
        },
      };
    }

    const offerings = await Purchases.getOfferings();
    
    if (offerings.current === null) {
      console.warn("[RevenueCat] No current offering found");
      return {
        monthly: {
          id: "monthly",
          price: "9,99 €",
        },
        annual: {
          id: "annual",
          price: "59,99 €",
        },
      };
    }

    const monthlyPackage = offerings.current.availablePackages.find(
      (pkg) => pkg.identifier === "monthly" || pkg.packageType === "MONTHLY"
    );
    const annualPackage = offerings.current.availablePackages.find(
      (pkg) => pkg.identifier === "annual" || pkg.packageType === "ANNUAL"
    );

    return {
      monthly: {
        id: monthlyPackage?.identifier || "monthly",
        price: monthlyPackage?.product.priceString || "9,99 €",
      },
      annual: {
        id: annualPackage?.identifier || "annual",
        price: annualPackage?.product.priceString || "59,99 €",
      },
    };
  } catch (error) {
    console.error("[RevenueCat] Error fetching offerings:", error);
    // Fallback to mock
    return {
      monthly: {
        id: "monthly",
        price: "9,99 €",
      },
      annual: {
        id: "annual",
        price: "59,99 €",
      },
    };
  }
}

export async function purchasePackage(packageId: string): Promise<boolean> {
  try {
    if (!isInitialized || !Purchases || (!process.env.EXPO_PUBLIC_RC_IOS && !process.env.EXPO_PUBLIC_RC_ANDROID)) {
      // Mock mode for development
      console.log(`[RevenueCat] Mock purchase: ${packageId}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return Math.random() > 0.2;
    }

    const offerings = await Purchases.getOfferings();
    if (!offerings.current) {
      console.error("[RevenueCat] No current offering available");
      return false;
    }

    const packageToPurchase = offerings.current.availablePackages.find(
      (pkg) => pkg.identifier === packageId || 
               (packageId === "monthly" && pkg.packageType === "MONTHLY") ||
               (packageId === "annual" && pkg.packageType === "ANNUAL")
    );

    if (!packageToPurchase) {
      console.error(`[RevenueCat] Package ${packageId} not found`);
      return false;
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    const isPremium = customerInfo.entitlements.active["premium"] !== undefined;
    console.log(`[RevenueCat] Purchase successful, premium: ${isPremium}`);
    
    return isPremium;
  } catch (error: any) {
    console.error("[RevenueCat] Purchase error:", error);
    
    // User cancelled
    if (error.userCancelled) {
      return false;
    }
    
    // Other errors
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    if (!isInitialized || !Purchases || (!process.env.EXPO_PUBLIC_RC_IOS && !process.env.EXPO_PUBLIC_RC_ANDROID)) {
      // Mock mode
      console.log("[RevenueCat] Mock restore");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return false;
    }

    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active["premium"] !== undefined;
    
    console.log(`[RevenueCat] Restore successful, premium: ${isPremium}`);
    return isPremium;
  } catch (error) {
    console.error("[RevenueCat] Restore error:", error);
    return false;
  }
}

export async function getEntitlements(): Promise<Entitlements> {
  try {
    if (!isInitialized || !Purchases || (!process.env.EXPO_PUBLIC_RC_IOS && !process.env.EXPO_PUBLIC_RC_ANDROID)) {
      // Mock mode
      return {
        premium: false,
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active["premium"] !== undefined;
    
    return {
      premium: isPremium,
    };
  } catch (error) {
    console.error("[RevenueCat] Error fetching entitlements:", error);
    return {
      premium: false,
    };
  }
}
