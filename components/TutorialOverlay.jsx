import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator, Keyboard, Platform } from "react-native";
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

   Two things learned from watching someone use it:

   Every step shows the same button in the same place. Steps that wait for the
   user still advance on their own the moment they do the thing — but hiding the
   button while waiting read as the tour being broken, and "why is there no
   button on this one" is a worse problem than someone tapping past a step.

   The bubble dodges the keyboard. Writing an answer is the first thing the tour
   asks for, and the keyboard covered the button that came next. */

const BUBBLE_MARGIN = 14;
/* Only used before the bubble has laid out once and told us how tall it really
   is; after that the real height decides whether it goes above or below. */
const BUBBLE_FALLBACK_HEIGHT = 190;

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
  const { active, step, index, total, rect, busy, next, skip, startDemo, enableNotifications, startInvite, refreshRect } =
    useTutorial();
  const [keyboard, setKeyboard] = useState(0);
  const [bubbleH, setBubbleH] = useState(0);

  useEffect(() => {
    // willShow on iOS so the bubble moves with the keyboard rather than after it.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const shown = Keyboard.addListener(showEvent, (e) => setKeyboard(e.endCoordinates?.height || 0));
    const hidden = Keyboard.addListener(hideEvent, () => setKeyboard(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  /* KeyboardAvoidingView shifts the page under us, so the hole we cut is in the
     wrong place until we look again. */
  useEffect(() => {
    const timer = setTimeout(refreshRect, 260);
    return () => clearTimeout(timer);
  }, [keyboard, refreshRect]);

  useEffect(() => setBubbleH(0), [step?.id]);

  if (!active || !step) return null;

  const { width: screenW, height: screenH } = Dimensions.get("window");
  const spotlit = !!step.target && !!rect;
  const height = bubbleH || BUBBLE_FALLBACK_HEIGHT;

  /* Above the keyboard whenever there is one — nothing else matters while it's
     up, because everything below it is unreachable. Otherwise under the spotlit
     control if it fits, above it if it doesn't, centred if there isn't one. */
  let bubblePos;
  if (keyboard > 0) {
    bubblePos = { bottom: keyboard + BUBBLE_MARGIN };
  } else if (spotlit) {
    const below = rect.y + rect.height + BUBBLE_MARGIN;
    bubblePos =
      below + height < screenH - 24
        ? { top: below }
        : { bottom: Math.max(24, screenH - rect.y + BUBBLE_MARGIN) };
  } else {
    bubblePos = { top: Math.max(24, screenH / 2 - height / 2) };
  }

  const fill = (s) => (s || "").replaceAll("{n}", t.demoPartnerName);
  const title = fill(t[step.titleKey]);
  const body = fill(t[step.bodyKey]);

  // Never null: the slot always holds a button, whatever the step is doing.
  const primary =
    {
      start: { label: t.tutStart, onPress: next },
      demo: { label: t.tutDemoCta, onPress: startDemo },
      notif: { label: t.tutNotifCta, onPress: enableNotifications },
      invite: { label: t.tutInviteCta, onPress: startInvite },
    }[step.cta] || { label: t.tutNext, onPress: next };

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

      <View
        style={[styles.bubble, bubblePos]}
        pointerEvents="auto"
        onLayout={(e) => setBubbleH(e.nativeEvent.layout.height)}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%` }]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        {!!body && <Text style={styles.body}>{body}</Text>}

        {!!step.await && (
          <View style={styles.waitingRow}>
            <Sparkles size={13} color={C.pinkText} />
            <Text style={styles.waiting}>{t.tutYourTurn}</Text>
          </View>
        )}

        <Pressable style={styles.primaryBtn} onPress={primary.onPress} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <CtaIcon cta={step.cta} />}
          <Text style={styles.primaryLabel}>{fill(primary.label)}</Text>
        </Pressable>

        {secondaryLabel ? (
          <Pressable onPress={next} disabled={busy} style={styles.secondaryBtn}>
            <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={skip} hitSlop={8} style={styles.secondaryBtn}>
            <Text style={styles.skip}>{t.tutExit}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Darker than it was: at 0.62 the page behind competed with the bubble for
  // attention and the whole thing read as a wall of text over a busy page.
  dim: { position: "absolute", backgroundColor: "rgba(38,31,24,0.80)" },
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
    paddingTop: 15,
    paddingBottom: 10,
    gap: 8,
    ...deepShadow,
  },
  progressTrack: { height: 3, borderRadius: 999, backgroundColor: C.cardBorder, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 999, backgroundColor: C.pinkDeep },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 26, lineHeight: 36, paddingRight: 8, color: C.ink },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 20, color: C.ink },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  waiting: { fontFamily: fonts.bodyExtraBold, fontSize: 12, color: C.pinkText },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.pinkDeep,
    borderRadius: 999,
    paddingVertical: 12,
    marginTop: 2,
  },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
  secondaryBtn: { alignItems: "center", paddingVertical: 6 },
  secondaryLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: C.inkSoft },
  skip: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: C.inkSoft },
});
