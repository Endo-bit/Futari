import { useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing, PanResponder, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { X } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import { PaperStage } from "../../components/plane/PaperShapes";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* Sending a paper plane, done with the hands rather than a button:
   swipe across the top of the page to tear it out, swipe down three times to
   fold it, then flick it up and away. The page is only sent once it has left
   the screen; if that fails it comes back, folded, to be thrown again. */

const FOLDS = 3;

export default function SendPlane() {
  const { date, spaceId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, api, getEntry, partnerName, showToast } = useApp();
  const entry = getEntry(String(date || ""));

  const [phase, setPhase] = useState("tear"); // tear → fold → throw → flying
  const [stage, setStage] = useState(-1); // -1: the page still in the book
  const [error, setError] = useState(null);
  const phaseRef = useRef("tear");
  const stageRef = useRef(-1);

  const tear = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const fly = useRef(new Animated.Value(0)).current;

  const setP = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const setS = (s) => {
    stageRef.current = s;
    setStage(s);
  };

  const doTear = () => {
    setP("busy");
    Animated.timing(tear, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start(() => {
      setS(0);
      setP("fold");
    });
  };

  const doFold = () => {
    setP("busy");
    Animated.timing(squash, { toValue: 0.05, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      const next = stageRef.current + 1;
      setS(next);
      Animated.spring(squash, { toValue: 1, friction: 5, useNativeDriver: true }).start(() => setP(next >= FOLDS ? "throw" : "fold"));
    });
  };

  const doThrow = () => {
    setError(null);
    setP("flying");
    Animated.timing(fly, { toValue: 1, duration: 950, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
    const started = Date.now();
    api
      .sendPlane(String(spaceId || ""), String(date || ""))
      .then(() => {
        track(EV.PLANE_SENT);
        AsyncStorage.setItem(`futari_plane_sent_${String(date || "")}`, "1").catch(() => {});
        setTimeout(() => {
          showToast(t.plSent.replace("{n}", partnerName), "heart");
          router.back();
        }, Math.max(0, 1000 - (Date.now() - started)));
      })
      .catch((err) => {
        // Toasts live in the tab bar's layout, which this screen covers.
        if (err?.message === "ALREADY_SENT") {
          AsyncStorage.setItem(`futari_plane_sent_${String(date || "")}`, "1").catch(() => {});
          setError(t.pgPlaneSent);
        } else {
          setError(err?.message === "NOT_PAIRED" ? t.plPlaneNeedsPair : t.plErrNet);
        }
        fly.setValue(0);
        setP("throw");
      });
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderRelease: (_e, g) => {
        const p = phaseRef.current;
        if (p === "tear" && Math.abs(g.dx) > 90 && Math.abs(g.dx) > Math.abs(g.dy)) doTear();
        else if (p === "fold" && g.dy > 60 && g.dy > Math.abs(g.dx)) doFold();
        else if (p === "throw" && g.dy < -70 && -g.dy > Math.abs(g.dx)) doThrow();
      },
    })
  ).current;

  const { height } = Dimensions.get("window");
  const hint =
    phase === "tear" ? t.plTearHint
    : phase === "fold" || (phase === "busy" && stage >= 0 && stage < FOLDS) ? t.plFoldHint.replace("{s}", String(Math.max(0, stage) + 1)).replace("{t}", String(FOLDS))
    : phase === "throw" ? t.plThrowHint.replace("{n}", partnerName)
    : "";

  const tearTransform = [
    { translateY: tear.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
    { rotate: tear.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-4deg"] }) },
  ];
  const flyTransform = [
    { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, -height] }) },
    { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }) },
    { rotate: fly.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "18deg"] }) },
    { scale: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
  ];

  return (
    <PaperBg>
      <View style={[styles.screen, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 20 }]} {...responder.panHandlers}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.plBack}>
            <X size={24} color={C.inkSoft} />
          </Pressable>
        </View>

        <View style={styles.stage}>
          {stage < 0 ? (
            <Animated.View style={[styles.page, { transform: tearTransform }]}>
              <View style={styles.perforation} />
              <View style={{ gap: 10 }}>
                {!!entry.prompt && <Text style={styles.prompt}>{entry.prompt}</Text>}
                {[entry.promptAnswer, entry.happy, entry.mind, entry.next].filter(Boolean).slice(0, 3).map((line, i) => (
                  <Text key={i} style={styles.line} numberOfLines={3}>{line}</Text>
                ))}
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [...flyTransform, { scaleY: squash }] }}>
              <PaperStage stage={Math.min(stage, FOLDS)} width={220} />
            </Animated.View>
          )}
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.hint}>{hint}</Text>
        {phase === "tear" && <Text style={styles.arrows}>⟵ ⟶</Text>}
        {phase === "fold" && <Text style={styles.arrows}>↓</Text>}
        {phase === "throw" && <Text style={styles.arrows}>↑</Text>}
      </View>
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  top: { height: 40, justifyContent: "center" },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  page: { width: "100%", maxWidth: 360, minHeight: 300, backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.cardBorder, padding: 20, paddingTop: 26, shadowColor: "#785046", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  perforation: { position: "absolute", top: 10, left: 12, right: 12, borderTopWidth: 2, borderStyle: "dashed", borderColor: C.pinkDeep },
  prompt: { fontFamily: fonts.scriptSemiBold, fontSize: 24, lineHeight: 32, paddingRight: 8, color: C.ink },
  line: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 23, color: C.ink },
  hint: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23, color: C.inkSoft, textAlign: "center", minHeight: 46 },
  error: { fontFamily: fonts.bodyBold, fontSize: 15, color: "#B0413E", textAlign: "center", marginBottom: 8 },
  arrows: { fontFamily: fonts.bodyBold, fontSize: 24, color: C.pinkText, textAlign: "center", marginTop: 4 },
});
