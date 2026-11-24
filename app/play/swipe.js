import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, PanResponder, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { HeartHandshake, RefreshCw } from "lucide-react-native";
import PlayShell, { PlayButton, playStyles } from "../../components/play/PlayShell";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { playContent } from "../../lib/play/content";
import { getSwipeAnswers, saveSwipeAnswers } from "../../lib/play/store";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* This or that: one card at a time, swipe left for the left option and right
   for the right one (or just tap a side). The answers are what the match
   check sends to the partner. */

const SWIPE_AT = 90;

export default function ThisOrThat() {
  const router = useRouter();
  const { t, lang } = useApp();
  const cards = playContent(lang).thisOrThat;
  const [answers, setAnswers] = useState([]);
  const [saved, setSaved] = useState(null);
  const pos = useRef(new Animated.ValueXY()).current;
  const answersRef = useRef([]);
  const lockRef = useRef(false);

  useEffect(() => {
    getSwipeAnswers().then((s) => {
      if (Array.isArray(s?.answers) && s.answers.length === cards.length) setSaved(s.answers);
    });
  }, []); // eslint-disable-line

  const commit = (side) => {
    if (lockRef.current || answersRef.current.length >= cards.length) return;
    lockRef.current = true;
    const width = Dimensions.get("window").width;
    Animated.timing(pos, { toValue: { x: side === 0 ? -width * 1.2 : width * 1.2, y: 0 }, duration: 200, useNativeDriver: false }).start(() => {
      const next = [...answersRef.current, side];
      answersRef.current = next;
      setAnswers(next);
      pos.setValue({ x: 0, y: 0 });
      lockRef.current = false;
      if (next.length === cards.length) {
        saveSwipeAnswers(next);
        setSaved(next);
        track(EV.GAME_FINISHED, { game: "swipe" });
      }
    });
  };

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: pos.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -SWIPE_AT) commit(0);
        else if (g.dx >= SWIPE_AT) commit(1);
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
    })
  ).current;

  const restart = () => {
    answersRef.current = [];
    setAnswers([]);
    setSaved(null);
  };

  const done = saved && answers.length === 0 ? saved : answers.length === cards.length ? answers : null;

  if (done) {
    return (
      <PlayShell
        title={t.plSwipeDoneTitle}
        sub={t.plSwipeDoneBody}
        footer={<PlayButton label={t.plCompare} onPress={() => router.push("/play/match")} icon={<HeartHandshake size={18} color="#fff" />} />}
      >
        <View style={{ gap: 8 }}>
          {cards.map((pair, i) => (
            <View key={i} style={styles.resultRow}>
              <Text style={[styles.resultOpt, done[i] === 0 && styles.resultPicked]}>{pair[0]}</Text>
              <Text style={styles.resultVs}>·</Text>
              <Text style={[styles.resultOpt, { textAlign: "right" }, done[i] === 1 && styles.resultPicked]}>{pair[1]}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={restart} style={styles.retry} hitSlop={8}>
          <RefreshCw size={15} color={C.inkSoft} />
          <Text style={styles.retryLabel}>{t.plRetry}</Text>
        </Pressable>
      </PlayShell>
    );
  }

  const i = answers.length;
  const pair = cards[i];
  const rotate = pos.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-12deg", "0deg", "12deg"] });
  const leftGlow = pos.x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: "clamp" });
  const rightGlow = pos.x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: "clamp" });

  return (
    <PlayShell title={t.plSwipeName} scroll={false}>
      <Text style={playStyles.kicker}>{t.plTypeCount.replace("{i}", String(i + 1)).replace("{t}", String(cards.length))}</Text>
      <Text style={playStyles.soft}>{t.plSwipeHint}</Text>
      <View style={styles.stage}>
        <Animated.View
          {...responder.panHandlers}
          style={[styles.card, { transform: [{ translateX: pos.x }, { rotate }] }]}
        >
          <Pressable style={styles.half} onPress={() => commit(0)} accessibilityRole="button">
            <Animated.View style={[StyleSheet.absoluteFill, styles.glowLeft, { opacity: leftGlow }]} />
            <Text style={styles.option}>{pair[0]}</Text>
            <Text style={styles.arrow}>←</Text>
          </Pressable>
          <View style={styles.divider}>
            <Text style={styles.heart}>♡</Text>
          </View>
          <Pressable style={styles.half} onPress={() => commit(1)} accessibilityRole="button">
            <Animated.View style={[StyleSheet.absoluteFill, styles.glowRight, { opacity: rightGlow }]} />
            <Text style={styles.option}>{pair[1]}</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </Animated.View>
      </View>
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, justifyContent: "center", paddingBottom: 40 },
  card: { flexDirection: "row", minHeight: 260, backgroundColor: C.card, borderRadius: 26, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden", shadowColor: "#785046", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  half: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 14 },
  glowLeft: { backgroundColor: C.pink },
  glowRight: { backgroundColor: "#E7EFE2" },
  option: { fontFamily: fonts.scriptBold, fontSize: 30, lineHeight: 40, paddingHorizontal: 4, color: C.ink, textAlign: "center" },
  arrow: { fontFamily: fonts.bodyBold, fontSize: 18, color: C.inkSoft },
  divider: { width: 1, backgroundColor: C.cardBorder, alignItems: "center", justifyContent: "center" },
  heart: { position: "absolute", width: 30, textAlign: "center", backgroundColor: C.card, fontSize: 18, color: C.pinkText },
  resultRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, paddingVertical: 11, paddingHorizontal: 14, gap: 8 },
  resultOpt: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: 15, color: C.inkSoft },
  resultPicked: { fontFamily: fonts.bodyExtraBold, color: C.pinkText },
  resultVs: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.inkSoft },
  retry: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingVertical: 8 },
  retryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.inkSoft },
});
