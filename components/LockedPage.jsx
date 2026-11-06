import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Lock, Heart, ChevronRight } from "lucide-react-native";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";
import { track } from "../lib/analytics";
import { EV } from "../lib/events";

/* The free plan's two surfaces: a closed partner page (this week's free open is
   spent), and the count of pages that waited. Both lead to the paywall — the
   page is the reason to subscribe, so it says whose page it is rather than
   showing a generic lock. */

/** A partner page that can't be opened this week. `where` is "today" or "past". */
export default function LockedPage({ where }) {
  const { t, partnerName } = useApp();
  const router = useRouter();

  useEffect(() => {
    track(EV.LOCKED_PAGE_VIEWED, { where });
  }, [where]);

  const open = () => {
    track(EV.PAYWALL_VIEWED, { source: "locked_page", where });
    router.push("/paywall");
  };

  return (
    <View style={styles.card}>
      <View style={styles.lockCircle}>
        <Lock size={18} color={C.pinkText} />
      </View>
      <Text style={styles.title}>{t.lockedPageTitle.replace("{n}", partnerName)}</Text>
      <Text style={styles.body}>{t.lockedPageBody}</Text>
      <Pressable onPress={open} style={styles.cta}>
        <Heart size={16} color="#fff" fill="#fff" />
        <Text style={styles.ctaLabel}>{t.lockedPageCta}</Text>
      </Pressable>
    </View>
  );
}

/** "3 pages from Mio are waiting" — shown on the free plan when any are. */
export function WaitingPagesBanner() {
  const { t, partnerName, waitingPages } = useApp();
  const router = useRouter();
  if (!waitingPages) return null;

  const label = (waitingPages === 1 ? t.waitingPagesOne : t.waitingPagesMany)
    .replace("{n}", partnerName)
    .replace("{c}", String(waitingPages));
  const open = () => {
    track(EV.PAYWALL_VIEWED, { source: "waiting_pages", count: waitingPages });
    router.push("/paywall");
  };

  return (
    <Pressable onPress={open} style={styles.banner}>
      <View style={styles.bannerIcon}>
        <Lock size={15} color={C.pinkText} />
      </View>
      <Text style={styles.bannerText}>{label}</Text>
      <ChevronRight size={18} color={C.pinkText} style={{ marginLeft: "auto" }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 20, gap: 8, ...cardShadow },
  lockCircle: { width: 40, height: 40, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  title: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: C.ink, textAlign: "center" },
  body: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 19, color: C.inkSoft, textAlign: "center" },
  cta: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 26, marginTop: 6 },
  ctaLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
  banner: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.pink, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16 },
  bannerIcon: { width: 30, height: 30, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  bannerText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: C.ink, flexShrink: 1 },
});
