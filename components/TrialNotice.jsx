import { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Heart, Sparkles } from "lucide-react-native";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

/* A nudge on day 2 and day 4 of the free trial, while there is still time to
   subscribe before the pairing is released.

   Shown at most once per milestone day — the marker is keyed by day index, so
   reinstalling or reopening the app does not re-show a notice the user already
   answered, and a user who skips day 2 still sees day 4.

   Declining is a real choice, not a delay: "keep using the free version" simply
   closes it, and nothing here blocks the app. */
const SEEN_KEY = "futari_trial_notice_seen";
const NOTICE_DAYS = [2, 4];

export default function TrialNotice() {
  const router = useRouter();
  const { t, trialActive, trialDayIndex, trialDaysLeft, me } = useApp();
  const [visible, setVisible] = useState(false);
  const [day, setDay] = useState(null);

  useEffect(() => {
    // Only worth saying while they are paired and the clock is actually running.
    if (!trialActive || !me?.pairId) return;
    if (!NOTICE_DAYS.includes(trialDayIndex)) return;

    let cancelled = false;
    AsyncStorage.getItem(`${SEEN_KEY}_${trialDayIndex}`).then((seen) => {
      if (cancelled || seen) return;
      setDay(trialDayIndex);
      setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, [trialActive, trialDayIndex, me?.pairId]);

  const dismiss = async () => {
    setVisible(false);
    if (day) await AsyncStorage.setItem(`${SEEN_KEY}_${day}`, "1").catch(() => {});
  };

  const goPremium = async () => {
    await dismiss();
    router.push("/paywall");
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Sparkles size={22} color={C.pinkText} />
          </View>

          <Text style={styles.title}>
            {t.trialNoticeTitle.replace("{n}", String(trialDaysLeft))}
          </Text>
          <Text style={styles.body}>{t.trialNoticeBody}</Text>

          <Pressable style={styles.primaryBtn} onPress={goPremium}>
            <Heart size={16} color="#fff" fill="#fff" />
            <Text style={styles.primaryLabel}>{t.trialNoticeCta}</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={dismiss}>
            <Text style={styles.secondaryLabel}>{t.trialNoticeKeepFree}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(74,64,54,0.5)", alignItems: "center", justifyContent: "center", padding: 22 },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 26,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 13,
    ...deepShadow,
  },
  iconCircle: { width: 54, height: 54, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 27, lineHeight: 40, paddingVertical: 2, paddingRight: 8, color: C.ink, textAlign: "center" },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 21, color: C.ink, textAlign: "center" },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.pinkDeep,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
  secondaryBtn: { paddingVertical: 8 },
  secondaryLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: C.inkSoft },
});
