import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Share, Platform, KeyboardAvoidingView, StyleSheet } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import * as Clipboard from "expo-clipboard";
import { Heart, Send, Link2, X } from "lucide-react-native";
import FloatingHearts from "../components/FloatingHearts";
import ToastView from "../components/Toast";
import { C, fonts } from "../lib/theme";
import { useApp } from "../lib/appState";
import { pairingLink } from "../lib/deepLinks";
import { markInviteScreenSeen } from "../lib/onboarding";
import { scheduleInviteNudge } from "../lib/pushNotifications";
import { track } from "../lib/analytics";
import { EV } from "../lib/events";

/* Straight after sign-up, the one thing that decides whether Futari works for
   someone: getting their partner in. It used to be the last card of a long tour
   and then a section in the fourth tab, and almost nobody paired.

   One screen, one big button that sends a link (the link pairs on its own when
   opened), a quieter way in for whoever received a code, and an honest "later".
   Sending schedules a single local nudge for tomorrow in case the link got lost;
   pairing cancels it. Also reachable from the invite card on Home. */

const POLL_MS = 4000;
const NUDGE_AFTER_MS = 24 * 60 * 60 * 1000;

export default function InviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded } = useAuth();
  const { t, api, me, refreshMe, canPair, partnerName, showToast } = useApp();

  const [code, setCode] = useState(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [justPaired, setJustPaired] = useState(false);
  const wasPaired = useRef(null);

  useEffect(() => {
    track(EV.INVITE_SCREEN_VIEWED);
  }, []);

  // Celebrate a pairing that happens while this screen is open, not one from before.
  useEffect(() => {
    if (!me) return;
    if (wasPaired.current === null && me.pairId) {
      // Already paired before arriving (an existing couple updating the app):
      // there is nothing to do here.
      markInviteScreenSeen().then(() => router.replace("/(tabs)/home"));
      return;
    }
    if (wasPaired.current === false && me.pairId) {
      setJustPaired(true);
      showToast(t.pairedToast, "heart");
    }
    wasPaired.current = !!me.pairId;
  }, [me?.pairId]); // eslint-disable-line

  // While a link is out, keep asking whether it has been used.
  useEffect(() => {
    if (!sent || me?.pairId) return;
    const timer = setInterval(() => refreshMe().catch(() => {}), POLL_MS);
    return () => clearInterval(timer);
  }, [sent, me?.pairId]); // eslint-disable-line

  if (!isLoaded) return <View style={styles.screen} />;
  if (!isSignedIn) return <Redirect href="/" />;

  const leave = async (skipped) => {
    await markInviteScreenSeen();
    if (skipped) track(EV.INVITE_SCREEN_SKIPPED, { sent });
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/today");
  };

  const ensureCode = async () => {
    if (code) return code;
    const res = await api.createInvite();
    setCode(res.code);
    track(EV.INVITE_CREATED, { source: "invite_screen" });
    return res.code;
  };

  const send = async () => {
    if (!canPair) {
      router.push("/paywall");
      track(EV.PAYWALL_VIEWED, { source: "invite_screen" });
      return;
    }
    setBusy(true);
    try {
      const c = await ensureCode();
      const message = t.pairInviteMessage.replace("{url}", pairingLink(c));
      const res = await Share.share(Platform.OS === "android" ? { message, title: t.pairInviteShareTitle } : { message });
      if (res?.action !== Share.dismissedAction) {
        setSent(true);
        track(EV.INVITE_SHARED, { method: "text", pairing: true, source: "invite_screen" });
        scheduleInviteNudge({ title: "Futari", body: t.notifInviteNudgeBody }, new Date(Date.now() + NUDGE_AFTER_MS)).catch(() => {});
      }
    } catch (err) {
      showToast(err?.message || t.shareFailed, "info");
      track(EV.PAIR_FAILED, { step: "create_invite", reason: err?.message || "unknown", source: "invite_screen" });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(pairingLink(code));
    showToast(t.codeCopied, "heart");
    track(EV.INVITE_SHARED, { method: "copy_link", pairing: true, source: "invite_screen" });
  };

  const redeem = async () => {
    const value = codeInput.trim();
    if (!value) return;
    if (!canPair) {
      router.push("/paywall");
      return;
    }
    setBusy(true);
    try {
      await api.redeemInvite(value);
      await refreshMe();
      track(EV.PAIR_REDEEMED, { via: "typed_code", source: "invite_screen" });
    } catch (err) {
      showToast(err.message, "info");
      track(EV.PAIR_FAILED, { via: "typed_code", reason: err?.message || "unknown" });
    } finally {
      setBusy(false);
    }
  };

  const paired = !!me?.pairId;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => leave(!paired)} hitSlop={10} accessibilityLabel={t.cancel}>
          <X size={22} color={C.inkSoft} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hearts}>
            <View style={[styles.avatar, { backgroundColor: C.pinkDeep }]} />
            <View style={[styles.avatar, styles.avatarRight, { backgroundColor: paired ? C.green : "transparent", borderStyle: paired ? "solid" : "dashed" }]} />
            <View style={styles.heartBadge}>
              <Heart size={14} color="#fff" fill="#fff" />
            </View>
          </View>

          {paired ? (
            <>
              <Text style={styles.title}>{t.invPairedTitle.replace("{n}", partnerName)}</Text>
              <Text style={styles.body}>{t.invPairedBody}</Text>
            </>
          ) : sent ? (
            <>
              <Text style={styles.title}>{t.invSentTitle}</Text>
              <Text style={styles.body}>{t.invSentBody}</Text>
              {!!code && <Text style={styles.code}>{code}</Text>}
              <View style={styles.row}>
                <Pressable onPress={copy} style={styles.chip}>
                  <Link2 size={14} color={C.pinkText} />
                  <Text style={styles.chipLabel}>{t.invCopy}</Text>
                </Pressable>
                <Pressable onPress={send} style={styles.chip} disabled={busy}>
                  <Send size={14} color={C.pinkText} />
                  <Text style={styles.chipLabel}>{t.invResend}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t.invTitle}</Text>
              <Text style={styles.body}>{t.invBody.replace("{d}", String(t.trialDays))}</Text>
            </>
          )}

          {!paired && (
            <View style={styles.codeBox}>
              {codeOpen ? (
                <View style={styles.row}>
                  <TextInput
                    value={codeInput}
                    onChangeText={(v) => setCodeInput(v.toUpperCase())}
                    placeholder={t.invCodePh}
                    placeholderTextColor="#B3A794"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    autoFocus
                    style={styles.codeInput}
                  />
                  <Pressable onPress={redeem} disabled={busy || !codeInput.trim()} style={[styles.redeem, !codeInput.trim() && styles.redeemOff]}>
                    <Text style={[styles.redeemLabel, !codeInput.trim() && { color: C.inkSoft }]}>{t.invRedeem}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setCodeOpen(true)} hitSlop={6}>
                  <Text style={styles.link}>{t.invHaveCode}</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {paired || sent ? (
            <Pressable onPress={() => leave(false)} style={styles.primary}>
              <Text style={styles.primaryLabel}>{t.invContinue}</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={send} disabled={busy} style={[styles.primary, busy && { opacity: 0.6 }]}>
                <Send size={16} color="#fff" />
                <Text style={styles.primaryLabel}>{t.invSendCta}</Text>
              </Pressable>
              <Pressable onPress={() => leave(true)} style={styles.textBtn} hitSlop={6}>
                <Text style={styles.textBtnLabel}>{t.invLater}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <FloatingHearts active={justPaired} />
      <ToastView />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  topBar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 22, height: 36, alignItems: "center" },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 14, paddingHorizontal: 28, paddingBottom: 24 },
  hearts: { width: 120, height: 72, marginBottom: 6 },
  avatar: { position: "absolute", top: 8, width: 56, height: 56, borderRadius: 28, left: 10, opacity: 0.9 },
  avatarRight: { left: 54, borderWidth: 2, borderColor: C.green },
  heartBadge: { position: "absolute", left: 47, top: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.pinkText, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.scriptBold, fontSize: 34, lineHeight: 46, paddingTop: 4, paddingRight: 12, color: C.ink, textAlign: "center" },
  body: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 24, color: C.inkSoft, textAlign: "center", maxWidth: 340 },
  code: { fontFamily: fonts.bodyExtraBold, fontSize: 26, letterSpacing: 6, color: C.ink, marginTop: 4 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(120,100,70,0.15)", backgroundColor: C.card, paddingVertical: 9, paddingHorizontal: 16 },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: C.pinkText },
  codeBox: { marginTop: 18, minHeight: 48, justifyContent: "center" },
  link: { fontFamily: fonts.bodyBold, fontSize: 14, color: C.pinkText, textDecorationLine: "underline" },
  codeInput: { width: 170, fontFamily: fonts.bodyBold, fontSize: 17, letterSpacing: 3, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(120,100,70,0.15)", backgroundColor: "#fff", color: C.ink },
  redeem: { backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20 },
  redeemOff: { backgroundColor: "#E9DFD2" },
  redeemLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: "#fff" },
  footer: { paddingHorizontal: 28, paddingTop: 8, gap: 4, maxWidth: 480, width: "100%", alignSelf: "center" },
  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 16 },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: "#fff" },
  textBtn: { alignItems: "center", paddingVertical: 12 },
  textBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: C.inkSoft },
});
