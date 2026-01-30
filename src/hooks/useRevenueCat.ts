import { useState, useCallback } from "react";
import { Purchases, PurchasesPackage, CustomerInfo } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";
// MUDANÇA: Removido import do Supabase
// import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "./useTranslation";

// RevenueCat Public API Key - safe to include in client code
const REVENUECAT_PUBLIC_KEY = "test_kJQLRGQsfiUclMutuswszNrfWHa";

export interface Offering {
  identifier: string;
  availablePackages: Package[];
}

export interface Package {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price: number;
    currencyCode: string;
    introductoryPrice?: {
      priceString: string;
      price: number;
      periodNumberOfUnits: number;
      periodUnit: string;
    };
  };
}

export function useRevenueCat() {
  const { t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isNativePlatform = Capacitor.isNativePlatform();

  // Initialize RevenueCat SDK
  const initialize = useCallback(async (userId?: string) => {
    if (!isNativePlatform) {
      console.log("RevenueCat: Not a native platform, skipping initialization");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_KEY,
        appUserID: userId || undefined,
      });

      setIsInitialized(true);
      console.log("RevenueCat initialized successfully");

      // Fetch offerings after initialization
      await fetchOfferings();

      // Get current customer info
      if (userId) {
        await getCustomerInfo();
      }

    } catch (err: unknown) {
      console.error("RevenueCat initialization error:", err);
      const message = err instanceof Error ? err.message : "Failed to initialize RevenueCat";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform]);

  // Identify user (call when user logs in)
  const identifyUser = useCallback(async (userId: string) => {
    if (!isNativePlatform) return;

    try {
      await Purchases.logIn({ appUserID: userId });
      console.log("RevenueCat: User identified:", userId);
      await getCustomerInfo();
    } catch (err: unknown) {
      console.error("RevenueCat identify error:", err);
    }
  }, [isNativePlatform]);

  // Logout (call when user logs out)
  const logoutUser = useCallback(async () => {
    if (!isNativePlatform) return;

    try {
      await Purchases.logOut();
      setCustomerInfo(null);
      console.log("RevenueCat: User logged out");
    } catch (err: unknown) {
      console.error("RevenueCat logout error:", err);
    }
  }, [isNativePlatform]);

  // Fetch available offerings
  const fetchOfferings = useCallback(async (): Promise<Offering[]> => {
    if (!isNativePlatform) {
      console.log("RevenueCat: Not a native platform");
      return [];
    }

    try {
      setIsLoading(true);
      const result = await Purchases.getOfferings();
      
      const mappedOfferings: Offering[] = [];
      
      if (result.current) {
        const currentOffering: Offering = {
          identifier: result.current.identifier,
          availablePackages: result.current.availablePackages.map(pkg => ({
            identifier: pkg.identifier,
            packageType: pkg.packageType,
            product: {
              identifier: pkg.product.identifier,
              title: pkg.product.title,
              description: pkg.product.description,
              priceString: pkg.product.priceString,
              price: pkg.product.price,
              currencyCode: pkg.product.currencyCode,
              introductoryPrice: pkg.product.introPrice ? {
                priceString: pkg.product.introPrice.priceString,
                price: pkg.product.introPrice.price,
                periodNumberOfUnits: pkg.product.introPrice.periodNumberOfUnits,
                periodUnit: pkg.product.introPrice.periodUnit,
              } : undefined,
            },
          })),
        };
        mappedOfferings.push(currentOffering);
      }

      setOfferings(mappedOfferings);
      return mappedOfferings;
    } catch (err: unknown) {
      console.error("RevenueCat offerings error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform]);

  // Get customer info
  const getCustomerInfo = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!isNativePlatform) return null;

    try {
      const { customerInfo: info } = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (err: unknown) {
      console.error("RevenueCat customer info error:", err);
      return null;
    }
  }, [isNativePlatform]);
  
  // Validate purchase on server (mock fallback for Firebase)
  const validatePurchaseOnServer = useCallback(async () => {
    console.log("Validating purchase on server (Mock for Firebase Migration)...");
    // Futuramente: Chamar Cloud Function do Firebase para validar
    return { success: true };
  }, []);

  // Purchase a package
  const purchasePackage = useCallback(async (packageId: string): Promise<boolean> => {
    if (!isNativePlatform) {
      toast.error(t("purchaseNativeOnly"));
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find the package
      const currentOffering = offerings[0];
      if (!currentOffering) {
        throw new Error("No offerings available");
      }

      const pkg = currentOffering.availablePackages.find(p => p.identifier === packageId);
      if (!pkg) {
        throw new Error("Package not found");
      }

      // Make the purchase
      const { customerInfo: newInfo } = await Purchases.purchasePackage({
        aPackage: pkg as unknown as PurchasesPackage,
      });

      setCustomerInfo(newInfo);

      // Check if premium entitlement is now active
      const hasPremium = newInfo.entitlements.active["premium"] !== undefined;
      
      if (hasPremium) {
        toast.success(t("purchaseSuccess"));
        
        // Validate purchase on server as backup
        await validatePurchaseOnServer();
        
        return true;
      }

      return false;
    } catch (err: unknown) {
      console.error("RevenueCat purchase error:", err);
      
      const errorObj = err as { code?: string; message?: string };
      
      // Handle user cancellation
      if (errorObj.code === "1" || errorObj.message?.includes("cancelled")) {
        toast.info(t("purchaseCancelled"));
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(t("purchaseError"));
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, offerings, t, validatePurchaseOnServer]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isNativePlatform) {
      toast.error(t("restoreNativeOnly"));
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo: restoredInfo } = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);

      const hasPremium = restoredInfo.entitlements.active["premium"] !== undefined;
      
      if (hasPremium) {
        toast.success(t("restoreSuccess"));
        await validatePurchaseOnServer();
        return true;
      } else {
        toast.info(t("restoreNoPurchases"));
        return false;
      }
    } catch (err: unknown) {
      console.error("RevenueCat restore error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(t("restoreError"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNativePlatform, t, validatePurchaseOnServer]);

  // Check if user has premium
  const hasPremium = useCallback((): boolean => {
    if (!customerInfo) return false;
    return customerInfo.entitlements.active["premium"] !== undefined;
  }, [customerInfo]);

  // Get management URL (for cancellation)
  const getManagementUrl = useCallback(async (): Promise<string | null> => {
    const info = await getCustomerInfo();
    return info?.managementURL || null;
  }, [getCustomerInfo]);

  return {
    isNativePlatform,
    isInitialized,
    isLoading,
    error,
    offerings,
    customerInfo,
    initialize,
    identifyUser,
    logoutUser,
    fetchOfferings,
    getCustomerInfo,
    purchasePackage,
    restorePurchases,
    validatePurchaseOnServer,
    hasPremium,
    getManagementUrl,
  };
}