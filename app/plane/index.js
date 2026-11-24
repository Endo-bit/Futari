import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Animated, Easing, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import FloatingHearts from "../../components/FloatingHearts";
import { PaperStage } from "../../components/plane/PaperShapes";
import { PairFieldCards } from "../../components/FieldCard";
import { PlayButton } from "../../components/play/PlayShell";
import { C, fonts } from "../../lib/theme";
import { useApp, fromIso } from "../../lib/appState";
import { pageTitle } from "../../lib/format";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* A paper plane landing: it glides in, waits to be tapped, and unfolds into
   the page your partner tore out for you. Several waiting planes are opened
   one after another. */

export default function ReceivePlane() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang, api, partnerName } = useApp();
  const [inbox, setInbox] = useState(null);
  const [phase, setPhase] = useState("landing"); // landing → waiting → unfolding → open
  const [stage, setStage] = useState(3);
  const [opened, setOpened] = useState(null);
  const [hearts, setHearts] = useState(false);
  const glide = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const land = () => {
    glide.setValue(0);
    setPhase("landing");
    setStage(3);
    Animated.timing(glide, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      setPhase("waiting");
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
  };

  useEffect(() => {
    api
      .planeInbox()
      .then((list) => {
        setInbox(list);
        if (list.length) land();
      })
      .catch(() => setInbox([]));
  }, []); // eslint-disable-line

  const unfold = async () => {
    if (phase !== "waiting" || !inbox?.length) return;
    setPhase("unfolding");
    bob.stopAnimation();
    let page;
    try {
      page = await api.openPlane(inbox[0].id);
    } catch {
      setPhase("waiting");
      return;
    }
    track(EV.PLANE_OPENED);
    for (const s of [2, 1, 0]) {
      await new Promise((r) => setTimeout(r, 220));
      setStage(s);
    }
    setOpened(page);
    setPhase("open");
    reveal.setValue(0);
    Animated.timing(reveal, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    setHearts(true);
    setTimeout(() => setHearts(false), 2400);
  };

  const next = () => {
    const rest = (inbox || []).slice(1);
    setInbox(rest);
    setOpened(null);
    if (rest.length) land();
    else router.back();
  };

  const from = (opened?.fromName || inbox?.[0]?.fromName || partnerName) ?? "";
  const planeStyle = {
    transform: [
      { translateX: glide.interpolate({ inputRange: [0, 1], outputRange: [-320, 0] }) },
      { translateY: Animated.add(glide.interpolate({ inputRange: [0, 0.6, 1], outputRange: [-420, -60, 0] }), bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })) },
      { rotate: glide.interpolate({ inputRange: [0, 1], outputRange: ["-35deg", "0deg"] }) },
      { scale: glide.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
    ],
  };

  return (
    <PaperBg>
      <View style={{ flex: 1, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 16 }}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.plBack}>
            <X size={24} color={C.inkSoft} />
          </Pressable>
        </View>

        {inbox === null ? (
          <ActivityIndicator color={C.pinkText} style={{ marginTop: 80 }} />
        ) : phase === "open" && opened ? (
          <>
            <ScrollView contentContainerStyle={styles.content}>
              <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }], gap: 12 }}>
                <Text style={styles.from}>{t.plFrom.replace("{n}", from)}</Text>
                <Text style={styles.date}>{pageTitle(fromIso(opened.dateIso), t, lang)}</Text>
                {!!opened.page?.prompt && <Text style={styles.prompt}>{opened.page.prompt}</Text>}
                <PairFieldCards entry={opened.page} t={t} />
              </Animated.View>
            </ScrollView>
            <View style={styles.footer}>
              <PlayButton label={(inbox || []).length > 1 ? t.plNext : t.plPlaneClose} onPress={next} />
            </View>
          </>
        ) : inbox.length ? (
          <Pressable style={styles.stage} onPress={unfold} accessibilityRole="button" accessibilityLabel={t.plOpenHint}>
            <Text style={styles.title}>{t.plArrived}</Text>
            <Animated.View style={phase === "unfolding" ? null : planeStyle}>
              <PaperStage stage={stage} width={stage === 3 ? 170 : 220} />
            </Animated.View>
            <Text style={styles.hint}>{phase === "waiting" ? t.plOpenHint : " "}</Text>
          </Pressable>
        ) : (
          <View style={styles.stage}>
            <Text style={styles.hint}>—</Text>
          </View>
        )}
      </View>
      <FloatingHearts active={hearts} />
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  top: { height: 40, justifyContent: "center", paddingHorizontal: 20 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", gap: 26, paddingHorizontal: 24 },
  title: { fontFamily: fonts.scriptBold, fontSize: 32, lineHeight: 42, paddingRight: 8, color: C.ink, textAlign: "center" },
  hint: { fontFamily: fonts.bodyBold, fontSize: 16, color: C.pinkText },
  content: { paddingHorizontal: 22, paddingBottom: 24, gap: 12, maxWidth: 520, width: "100%", alignSelf: "center" },
  from: { fontFamily: fonts.bodyExtraBold, fontSize: 14, letterSpacing: 0.6, color: C.pinkText },
  date: { fontFamily: fonts.scriptBold, fontSize: 32, lineHeight: 42, paddingRight: 8, color: C.ink },
  prompt: { fontFamily: fonts.scriptSemiBold, fontSize: 24, lineHeight: 32, paddingRight: 8, color: C.ink },
  footer: { paddingHorizontal: 22, paddingTop: 8, maxWidth: 520, width: "100%", alignSelf: "center" },
});
