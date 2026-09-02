import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "@clerk/expo";

const ENTITLEMENT_ID = "premium";

/* react-native-purchases is a native module — it isn't present in Expo Go or
   on web (`expo start --web`), so every call is guarded. When unavailable,
   isPremium simply stays false and the rest of the app keeps working. */
function loadPurchases() {
  if (Platform.OS === "web") return null;
  try {
    return require("react-native-purchases").default;
  } catch {
    return null;
  }
}

const EntitlementContext = createContext({
  isPremium: false,
  isLoading: true,
  isAvailable: false,
  refresh: async () => {},
});

export function EntitlementProvider({ children }) {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const Purchases = loadPurchases();
  const isAvailable = !!Purchases;

  const applyCustomerInfo = useCallback((info) => {
    setIsPremium(!!info?.entitlements?.active?.[ENTITLEMENT_ID]);
  }, []);

  const refresh = useCallback(async () => {
    if (!Purchases) {
      setIsLoading(false);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      applyCustomerInfo(info);
    } catch {
      // not configured yet, or offline — leave isPremium as-is
    } finally {
      setIsLoading(false);
    }
  }, [Purchases, applyCustomerInfo]);

  useEffect(() => {
    if (!authLoaded) return;
    if (!Purchases) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    // This effect re-runs whenever the signed-in user changes, and until it has
    // finished talking to RevenueCat for the NEW user, isPremium still describes
    // the old one. Say so, so nothing reads a stale false as "not subscribed".
    setIsLoading(true);
    (async () => {
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
      if (!apiKey) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        Purchases.configure({ apiKey });
        if (userId) {
          await Purchases.logIn(userId);
        } else {
          // Signed out: drop back to an anonymous RevenueCat user so the next
          // sign-in starts clean. The purchase itself belongs to the Apple ID,
          // not to this app user, so logging in again restores it.
          await Purchases.logOut().catch(() => {});
        }
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) applyCustomerInfo(info);
      } catch {
        // ignore — e.g. running without a real API key yet
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const listener = (info) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener?.(listener);
    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener?.(listener);
    };
  }, [Purchases, authLoaded, userId, applyCustomerInfo]);

  return (
    <EntitlementContext.Provider value={{ isPremium, isLoading, isAvailable, refresh }}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement() {
  return useContext(EntitlementContext);
}
