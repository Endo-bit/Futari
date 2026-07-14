import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { X, Heart, Check, CalendarDays, Download } from "lucide-react-native";
import PaperBg from "../components/PaperBg";
import SaveButton from "../components/SaveButton";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";
import { useEntitlement } from "../lib/entitlement";

function loadPurchases() {
  if (Platform.OS === "web") return null;
  try {
    return require("react-native-purchases").default;
  } catch {
    return null;
  }
}

function FeatureRow({ icon, label }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export default function Paywall() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { t, showToast } = useApp();
  const { isAvailable, refresh } = useEntitlement();
  const insets = useSafeAreaInsets();
  const Purchases = loadPurchases();

  const [offering, setOffering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  useEffect(() => {
    if (!Purchases) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Purchases.getOfferings()
      .then((o) => {
        if (cancelled) return;
        setOffering(o.current);
        if (!o.current?.monthly && o.current?.annual) setSelectedPlan("annual");
        const hasAnyPackage = !!(o.current?.monthly || o.current?.annual || o.current?.availablePackages?.length);
        if (!hasAnyPackage) {
          console.warn("[paywall] no packages in current offering:", JSON.stringify(o));
          setError("No packages found in RevenueCat's current offering.");
        }
      })
      .catch((err) => {
        console.error("[paywall] getOfferings failed:", err);
        if (!cancelled) setError(err?.message || true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [Purchases]);

  const monthlyPkg = offering?.monthly || null;
  const annualPkg = offering?.annual || null;
  const hasBothPlans = !!monthlyPkg && !!annualPkg;
  const pkg = (selectedPlan === "annual" ? annualPkg : monthlyPkg) || annualPkg || monthlyPkg || offering?.availablePackages?.[0];

  const handlePurchase = async () => {
    if (!Purchases || !pkg) return;
    setPurchasing(true);
    setError(false);
    try {
      await Purchases.purchasePackage(pkg);
      await refresh();
      router.back();
    } catch (err) {
      if (!err?.userCancelled) {
        console.error("[paywall] purchasePackage failed:", err);
        showToast(err?.message || t.paywallError, "info");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!Purchases) return;
    setPurchasing(true);
    setError(false);
    try {
      await Purchases.restorePurchases();
      await refresh();
      router.back();
    } catch (err) {
      console.error("[paywall] restorePurchases failed:", err);
      showToast(err?.message || t.paywallError, "info");
    } finally {
      setPurchasing(false);
    }
  };

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <PaperBg>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={C.inkSoft} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.iconCircle}>
          <Heart size={30} color={C.pinkText} fill={C.pinkText} />
        </View>
        <Text style={styles.title}>{t.paywallTitle}</Text>
        <Text style={styles.sub}>{t.paywallSub}</Text>

        <View style={styles.features}>
          <FeatureRow icon={<Heart size={16} color={C.pinkText} />} label={t.paywallFeaturePairing} />
          <FeatureRow icon={<CalendarDays size={16} color={C.pinkText} />} label={t.paywallFeatureSpecialDays} />
          <FeatureRow icon={<Download size={16} color={C.pinkText} />} label={t.paywallFeatureExport} />
        </View>

        {loading ? (
          <ActivityIndicator color={C.pinkDeep} style={{ marginTop: 20 }} />
        ) : !isAvailable ? (
          <View style={styles.priceCard}>
            <Text style={styles.trialNote}>
              Preview only in this build — real purchases need an EAS development build with a RevenueCat API key.
            </Text>
          </View>
        ) : pkg ? (
          <>
            {hasBothPlans && (
              <View style={styles.planRow}>
                <Pressable
                  onPress={() => setSelectedPlan("monthly")}
                  style={[styles.planBtn, selectedPlan === "monthly" && styles.planBtnSel]}
                >
                  <Text style={[styles.planLabel, { color: selectedPlan === "monthly" ? "#fff" : C.ink }]}>{t.paywallMonthlyLabel}</Text>
                  <Text style={[styles.planPrice, { color: selectedPlan === "monthly" ? "#fff" : C.inkSoft }]}>
                    {monthlyPkg.product.priceString}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedPlan("annual")}
                  style={[styles.planBtn, selectedPlan === "annual" && styles.planBtnSel]}
                >
                  <Text style={[styles.planLabel, { color: selectedPlan === "annual" ? "#fff" : C.ink }]}>{t.paywallYearlyLabel}</Text>
                  <Text style={[styles.planPrice, { color: selectedPlan === "annual" ? "#fff" : C.inkSoft }]}>
                    {annualPkg.product.priceString}
                  </Text>
                </Pressable>
              </View>
            )}
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>{pkg.product.priceString}</Text>
              <Text style={styles.trialNote}>{t.paywallTrialNote}</Text>
            </View>
            <SaveButton onPress={handlePurchase} disabled={purchasing} label={t.paywallCta} icon={<Check size={18} color="#fff" />} />
            <Pressable onPress={handleRestore} disabled={purchasing} style={{ marginTop: 14 }}>
              <Text style={styles.restore}>{t.paywallRestore}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.unavailable}>
            {error ? t.paywallError : t.paywallLoading}
            {typeof error === "string" ? `\n(${error})` : ""}
          </Text>
        )}

        <Pressable onPress={() => router.back()} style={{ marginTop: 18 }}>
          <Text style={styles.notNow}>{t.paywallClose}</Text>
        </Pressable>
      </ScrollView>
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 18, paddingTop: 18 },
  closeBtn: { padding: 6 },
  body: { alignItems: "center", paddingHorizontal: 28, paddingBottom: 40, paddingTop: 6 },
  iconCircle: { width: 64, height: 64, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontFamily: fonts.scriptBold, fontSize: 32, lineHeight: 47, paddingVertical: 3, paddingRight: 9, color: C.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 14, color: C.inkSoft, textAlign: "center", lineHeight: 21, marginBottom: 22, maxWidth: 300 },
  features: { width: "100%", gap: 12, marginBottom: 22 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  featureIcon: { width: 30, height: 30, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: C.ink, flex: 1 },
  planRow: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 14 },
  planBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder },
  planBtnSel: { backgroundColor: C.pinkDeep, borderColor: C.pinkDeep },
  planLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14 },
  planPrice: { fontFamily: fonts.bodyBold, fontSize: 12.5, marginTop: 2 },
  priceCard: { width: "100%", backgroundColor: C.greenSoft, borderRadius: 18, padding: 16, alignItems: "center", marginBottom: 16 },
  priceLabel: { fontFamily: fonts.scriptBold, fontSize: 30, lineHeight: 44, paddingVertical: 3, paddingRight: 8, color: C.ink },
  trialNote: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: C.inkSoft, textAlign: "center", marginTop: 4, lineHeight: 18 },
  restore: { fontFamily: fonts.bodyBold, fontSize: 13, color: C.pinkText },
  notNow: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: C.inkSoft },
  unavailable: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.inkSoft, textAlign: "center" },
});
