import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "@clerk/expo";
import { track } from "./analytics";
import { EV } from "./events";

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
      let stage = "configure";
      try {
        /* Configure exactly once per launch. This effect re-runs on every
           sign-in/out, and configuring again replaces the shared instance in the
           middle of whatever the last one was doing — one account created on
           2026-10-08 never reached RevenueCat at all, and swallowing every error
           here meant there was no way to see why. */
        if (!(await Purchases.isConfigured?.().catch(() => false))) Purchases.configure({ apiKey });
        stage = userId ? "log_in" : "log_out";
        if (userId) {
          await Purchases.logIn(userId);
        } else {
          // Signed out: drop back to an anonymous RevenueCat user so the next
          // sign-in starts clean. The purchase itself belongs to the Apple ID,
          // not to this app user, so logging in again restores it.
          await Purchases.logOut().catch(() => {});
        }
        stage = "customer_info";
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) applyCustomerInfo(info);
      } catch (err) {
        track(EV.RC_ERROR, { stage, message: String(err?.message || err).slice(0, 200) });
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
