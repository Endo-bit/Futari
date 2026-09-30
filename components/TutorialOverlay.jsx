import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, ActivityIndicator, Keyboard } from "react-native";
import { Heart, Sparkles, Bell, Send, ChevronRight, Check } from "lucide-react-native";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";
import { useTutorial, RING, GAP, KEYBOARD_BAR, BUBBLE_FALLBACK_HEIGHT } from "../lib/tutorial";

/* The guided tour, drawn.

   The dimming is four panels around the spotlit control rather than one sheet
   with a hole punched in it, because the control has to stay tappable: the whole
   point is that the user presses the real button on the real page. A full-screen
   overlay with pointerEvents="none" couldn't block the rest of the screen, and
   one with "auto" would swallow the tap we're asking for. Four panels give both.

   Things learned from watching someone use it:

   Every step shows the same button in the same place. Steps that wait for the
   user still advance on their own the moment they do the thing — but hiding the
   button while waiting read as the tour being broken, and "why is there no
   button on this one" is a worse problem than someone tapping past a step.

   The bubble disappears while the keyboard is up. It used to climb on top of
   the keyboard, which put it squarely over the box being typed into. Writing
   needs the box and nothing else, so all that stays is a "Done" riding on the
   keyboard — a multi-line box has no return key to close it, and the dimmed
   page swallows the tap that would otherwise have done it.

   Nothing appears before it knows where it belongs. The bubble used to show in
   the middle of the screen and then jump once the control had been measured. */

function Panel({ style }) {
  // Tapping the dark closes the keyboard, the way tapping the page normally would.
  return <Pressable accessible={false} onPress={Keyboard.dismiss} style={[styles.dim, style]} />;
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
  const {
    active, step, index, total, rect, missing, keyboard, bounds, busy,
    next, skip, startDemo, enableNotifications, startInvite, reportBubbleHeight,
  } = useTutorial();
  const [bubbleH, setBubbleH] = useState(0);

  if (!active || !step) return null;

  const { width: screenW } = Dimensions.get("window");
  const typing = keyboard > 0;
  const spotlit = !!step.target && !!rect;
  // Still looking for the control: stay dark and say nothing yet.
  const pending = !!step.target && !rect && !missing;
  const height = bubbleH || BUBBLE_FALLBACK_HEIGHT;

  /* Beside the spotlit control, on the side the engine left room for; pinned to
     an edge of the screen if the control is too tall to leave room on either;
     centred when there is no control at all. */
  let bubbleTop;
  if (spotlit) {
    const below = rect.y + rect.height + RING + GAP;
    const above = rect.y - RING - GAP - height;
    const fitsBelow = below + height <= bounds.bottom;
    const fitsAbove = above >= bounds.top;
    if (step.anchor === "end") bubbleTop = fitsAbove ? above : fitsBelow ? below : bounds.top;
    else bubbleTop = fitsBelow ? below : fitsAbove ? above : bounds.bottom - height;
  } else {
    bubbleTop = Math.max(bounds.top, (bounds.top + bounds.bottom - height) / 2);
  }
  const bubbleHidden = typing || pending || !bubbleH;

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

  const hole = spotlit && {
    top: rect.y - RING,
    left: rect.x - RING,
    width: rect.width + RING * 2,
    height: rect.height + RING * 2,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {spotlit ? (
        <>
          <Panel style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <Panel style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <Panel style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <Panel
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              width: Math.max(0, screenW - hole.left - hole.width),
              height: hole.height,
            }}
          />
          {/* A step that only shows something keeps its spotlight but not its
              taps — a tap on the calendar would walk off to another page with
              the tour still pointing at where the calendar had been. */}
          <View pointerEvents={step.passive ? "auto" : "none"} style={[styles.ring, hole]} />
        </>
      ) : (
        <Panel style={StyleSheet.absoluteFillObject} />
      )}

      <View
        style={[styles.bubble, { top: bubbleTop }, bubbleHidden && styles.hidden]}
        pointerEvents={bubbleHidden ? "none" : "auto"}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setBubbleH(h);
          reportBubbleHeight(h);
        }}
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

      {typing && (
        <View style={[styles.keyboardBar, { bottom: keyboard }]} pointerEvents="box-none">
          <Pressable style={styles.doneBtn} onPress={Keyboard.dismiss} hitSlop={8}>
            <Check size={16} color="#fff" strokeWidth={3} />
            <Text style={styles.doneLabel}>{t.done}</Text>
          </Pressable>
        </View>
      )}
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
  // Kept mounted so its height stays known; just not seen or touched.
  hidden: { opacity: 0 },
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
  keyboardBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: KEYBOARD_BAR,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.pinkDeep,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
    ...deepShadow,
  },
  doneLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: "#fff" },
});
