import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Image, Animated, Easing, StyleSheet } from "react-native";
import { Share2, RefreshCw } from "lucide-react-native";
import PlayShell, { PlayButton, playStyles } from "../../components/play/PlayShell";
import FloatingHearts from "../../components/FloatingHearts";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { playContent, TYPE_MATCH } from "../../lib/play/content";
import { scoreLoveType } from "../../lib/play/logic";
import { getTypeResult, saveTypeResult } from "../../lib/play/store";
import { shareCardImage, shareText } from "../../lib/play/share";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

const APP_URL = "https://apps.apple.com/app/id6789121884";

/** The result as a card — the very view that is captured when sharing. */
function ResultCard({ cardRef, type, content, t }) {
  const info = content.types[type];
  const match = content.types[TYPE_MATCH[type]];
  return (
    <View ref={cardRef} collapsable={false} style={styles.card}>
      <Text style={playStyles.kicker}>{t.plTypeYouAre}</Text>
      <Text style={styles.typeName}>{info.name}</Text>
      <Text style={styles.line}>{info.line}</Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>{t.plTypeTip}</Text>
        <Text style={styles.tip}>{info.tip}</Text>
      </View>
      <Text style={styles.matchLabel}>
        {t.plTypeMatch} · <Text style={{ color: C.pinkText }}>{match.name}</Text>
      </Text>
      <View style={styles.brand}>
        <Image source={require("../../assets/icon.png")} style={styles.brandIcon} />
        <Text style={styles.brandName}>Futari</Text>
      </View>
    </View>
  );
}

export default function LoveTypeQuiz() {
  const { t, lang, showToast } = useApp();
  const content = playContent(lang);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [hearts, setHearts] = useState(false);
  const [busy, setBusy] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const cardRef = useRef(null);

  useEffect(() => {
    getTypeResult().then((saved) => {
      if (saved?.type && content.types[saved.type]) setResult(saved.type);
    });
  }, []); // eslint-disable-line

  const total = content.typeQuiz.length;
  const qi = answers.length;

  // A second tap while the question is fading out must not count twice.
  const moving = useRef(false);
  const choose = (pick) => {
    if (qi >= total || moving.current) return;
    moving.current = true;
    const next = [...answers, pick];
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      moving.current = false;
      setAnswers(next);
      if (next.length === total) {
        const type = scoreLoveType(next);
        setResult(type);
        saveTypeResult(type);
        setHearts(true);
        setTimeout(() => setHearts(false), 2400);
        track(EV.GAME_FINISHED, { game: "type", result: type });
      }
      Animated.timing(fade, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  const restart = () => {
    setAnswers([]);
    setResult(null);
  };

  const shareImage = async () => {
    setBusy(true);
    try {
      const ok = await shareCardImage(cardRef, { dialogTitle: t.plShare });
      if (!ok) showToast(t.shareUnavailable, "info");
      else track(EV.GAME_SHARED, { game: "type", as: "image" });
    } catch {
      showToast(t.shareFailed, "info");
    } finally {
      setBusy(false);
    }
  };

  const askPartner = async () => {
    const info = content.types[result];
    try {
      const sent = await shareText(`${t.plTypeYouAre}: ${info.name}\n${t.plTypeAskPartner} → ${APP_URL}`);
      if (sent) track(EV.GAME_SHARED, { game: "type", as: "invite" });
    } catch {
      // The share sheet failing to open isn't worth an error message.
    }
  };

  if (result) {
    return (
      <PlayShell
        footer={
          <>
            <PlayButton label={t.plShare} onPress={shareImage} disabled={busy} icon={<Share2 size={18} color="#fff" />} />
            <PlayButton label={t.plTypeAskPartner} onPress={askPartner} tone="ghost" />
          </>
        }
      >
        <ResultCard cardRef={cardRef} type={result} content={content} t={t} />
        <Pressable onPress={restart} style={styles.retry} hitSlop={8}>
          <RefreshCw size={15} color={C.inkSoft} />
          <Text style={styles.retryLabel}>{t.plRetry}</Text>
        </Pressable>
        <FloatingHearts active={hearts} />
      </PlayShell>
    );
  }

  const q = content.typeQuiz[qi];
  return (
    <PlayShell title={t.plTypeName}>
      <Text style={playStyles.kicker}>{t.plTypeCount.replace("{i}", String(qi + 1)).replace("{t}", String(total))}</Text>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${(qi / total) * 100}%` }]} />
      </View>
      <Animated.View style={{ opacity: fade, gap: 12 }}>
        <Text style={styles.question}>{q.q}</Text>
        {q.a.map((label, i) => (
          <Pressable key={i} onPress={() => choose(i)} style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} accessibilityRole="button">
            <Text style={styles.optionLabel}>{label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  progress: { height: 6, borderRadius: 3, backgroundColor: "rgba(120,100,70,0.12)", overflow: "hidden", marginTop: -4 },
  progressFill: { height: 6, backgroundColor: C.pinkDeep },
  question: { fontFamily: fonts.scriptSemiBold, fontSize: 30, lineHeight: 40, paddingRight: 8, color: C.ink, marginVertical: 6 },
  option: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.cardBorder, paddingVertical: 17, paddingHorizontal: 18 },
  optionPressed: { borderColor: C.pinkDeep, backgroundColor: "#FFF6F7" },
  optionLabel: { fontFamily: fonts.bodyBold, fontSize: 16.5, lineHeight: 23, color: C.ink },
  card: { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.cardBorder, padding: 22, gap: 10, marginTop: 6 },
  typeName: { fontFamily: fonts.scriptBold, fontSize: 38, lineHeight: 50, paddingRight: 10, color: C.ink },
  line: { fontFamily: fonts.bodyRegular, fontSize: 16.5, lineHeight: 25, color: C.ink },
  tipBox: { backgroundColor: C.pink, borderRadius: 16, padding: 14, gap: 4, marginTop: 4 },
  tipLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: C.pinkText },
  tip: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 22, color: C.ink },
  matchLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.inkSoft, marginTop: 2 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, alignSelf: "flex-end" },
  brandIcon: { width: 24, height: 24, borderRadius: 6 },
  brandName: { fontFamily: fonts.scriptBold, fontSize: 22, lineHeight: 30, paddingRight: 6, color: C.ink },
  retry: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingVertical: 8 },
  retryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.inkSoft },
});
