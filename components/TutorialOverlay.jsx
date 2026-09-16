import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Heart, Sparkles, Bell, Send, ChevronRight } from "lucide-react-native";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";
import { useTutorial } from "../lib/tutorial";

/* The guided tour, drawn.

   The dimming is four panels around the spotlit control rather than one sheet
   with a hole punched in it, because the control has to stay tappable: the whole
   point is that the user presses the real button on the real page. A full-screen
   overlay with pointerEvents="none" couldn't block the rest of the screen, and
   one with "auto" would swallow the tap we're asking for. Four panels give both.

   Steps that wait on the user show no "next" — they advance when it happens. An
   escape hatch fades in a few seconds later so nobody can be stranded. */

const ESCAPE_HATCH_MS = 6000;
const BUBBLE_MARGIN = 14;
const BUBBLE_EST_HEIGHT = 230;

function Panel({ style }) {
  return <View pointerEvents="auto" style={[styles.dim, style]} />;
}

function CtaIcon({ cta }) {
  if (cta === "notif") return <Bell size={17} color="#fff" />;
  if (cta === "invite") return <Send size={17} color="#fff" />;
  if (cta === "demo") return <Sparkles size={17} color="#fff" />;
  if (cta === "start") return <Heart size={17} color="#fff" fill="#fff" />;
  return <ChevronRight size={17} color="#fff" />;
}

export default function TutorialOverlay() {
  const { t } = useApp();
  const { active, step, index, total, rect, busy, next, skip, startDemo, enableNotifications, startInvite } =
    useTutorial();
  const [escapeVisible, setEscapeVisible] = useState(false);

  // Reset and re-arm the escape hatch on every step.
  useEffect(() => {
    setEscapeVisible(false);
    if (!step?.await) return;
    const timer = setTimeout(() => setEscapeVisible(true), ESCAPE_HATCH_MS);
    return () => clearTimeout(timer);
  }, [step?.id, step?.await]);

  if (!active || !step) return null;

  const { width: screenW, height: screenH } = Dimensions.get("window");
  const spotlit = !!step.target && !!rect;

  // Where the bubble goes: under the control if it fits, otherwise above it.
  let bubblePos = { top: screenH / 2 - BUBBLE_EST_HEIGHT / 2 };
  if (spotlit) {
    const below = rect.y + rect.height + BUBBLE_MARGIN;
    bubblePos =
      below + BUBBLE_EST_HEIGHT < screenH - 24
        ? { top: below }
        : { bottom: Math.max(24, screenH - rect.y + BUBBLE_MARGIN) };
  }

  const title = t[step.titleKey] || "";
  const body = (t[step.bodyKey] || "").replace("{n}", t.demoPartnerName);

  const primary = {
    start: { label: t.tutStart, onPress: next },
    demo: { label: t.tutDemoCta, onPress: startDemo },
    notif: { label: t.tutNotifCta, onPress: enableNotifications },
    invite: { label: t.tutInviteCta, onPress: startInvite },
  }[step.cta] || (step.await ? null : { label: t.tutNext, onPress: next });

  const secondaryLabel =
    step.cta === "notif" ? t.tutNotifLater : step.cta === "invite" ? t.tutInviteLater : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {spotlit ? (
        <>
          <Panel style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.y - 6) }} />
          <Panel style={{ top: rect.y + rect.height + 6, left: 0, right: 0, bottom: 0 }} />
          <Panel style={{ top: rect.y - 6, left: 0, width: Math.max(0, rect.x - 6), height: rect.height + 12 }} />
          <Panel
            style={{
              top: rect.y - 6,
              left: rect.x + rect.width + 6,
              width: Math.max(0, screenW - (rect.x + rect.width) - 6),
              height: rect.height + 12,
            }}
          />
          <View
            pointerEvents="none"
            style={[
              styles.ring,
              { top: rect.y - 6, left: rect.x - 6, width: rect.width + 12, height: rect.height + 12 },
            ]}
          />
        </>
      ) : (
        <Panel style={StyleSheet.absoluteFillObject} />
      )}

      <View style={[styles.bubble, bubblePos]} pointerEvents="auto">
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%` }]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        {step.await && !primary && (
          <View style={styles.waitingRow}>
            <Sparkles size={14} color={C.pinkText} />
            <Text style={styles.waiting}>{t.tutYourTurn}</Text>
          </View>
        )}

        {primary && (
          <Pressable style={styles.primaryBtn} onPress={primary.onPress} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <CtaIcon cta={step.cta} />}
            <Text style={styles.primaryLabel}>{primary.label}</Text>
          </Pressable>
        )}

        {secondaryLabel && (
          <Pressable onPress={next} disabled={busy} style={styles.secondaryBtn}>
            <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
          </Pressable>
        )}

        <View style={styles.footerRow}>
          <Pressable onPress={skip} hitSlop={8}>
            <Text style={styles.skip}>{t.tutExit}</Text>
          </Pressable>
          {step.await && escapeVisible && (
            <Pressable onPress={next} hitSlop={8}>
              <Text style={styles.skipStep}>{t.tutSkipStep}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { position: "absolute", backgroundColor: "rgba(74,64,54,0.62)" },
  ring: {
    position: "absolute",
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: C.pinkDeep,
  },
  bubble: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 9,
    ...deepShadow,
  },
  progressTrack: { height: 3, borderRadius: 999, backgroundColor: C.cardBorder, overflow: "hidden", marginBottom: 2 },
  progressFill: { height: 3, borderRadius: 999, backgroundColor: C.pinkDeep },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 25, lineHeight: 37, paddingRight: 8, color: C.ink },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 21, color: C.ink },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  waiting: { fontFamily: fonts.bodyExtraBold, fontSize: 12.5, color: C.pinkText },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.pinkDeep,
    borderRadius: 999,
    paddingVertical: 13,
    marginTop: 4,
  },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
  secondaryBtn: { alignItems: "center", paddingVertical: 8 },
  secondaryLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: C.inkSoft },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  skip: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: C.inkSoft },
  skipStep: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: C.pinkText },
});
