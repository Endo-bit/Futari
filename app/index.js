import { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, Pressable, Modal, TextInput, ScrollView, Keyboard,
  Platform, Animated, Easing, StyleSheet,
} from "react-native";
import { Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { Heart, Lock, Bell } from "lucide-react-native";
import FloatingHearts from "../components/FloatingHearts";
import { C, fonts } from "../lib/theme";
import { useApp } from "../lib/appState";
import { isoOf } from "../lib/format";
import { saveOnboardingAnswer, inviteScreenSeen } from "../lib/onboarding";
import { enableReminderLocal } from "../lib/reminder";
import { notificationAccess } from "../lib/pushNotifications";
import { track } from "../lib/analytics";
import { EV } from "../lib/events";

/* First run, before any account exists.

   The old flow was a landing page with two buttons and a sign-up wall, then a
   tour drawn over the real app. Almost nobody who signed up came back the next
   day, and most left within a few minutes of opening the app — before the tour
   had shown them what the app is for, and before it had asked whether it could
   remind them.

   So the order is now: show the idea in one line, let them write one answer,
   open it together with a stand-in partner, ask for the reminder, and only then
   ask for an account — framed as keeping the page they just wrote, which is
   carried into their diary once they sign up. Each screen is its own plain page
   with one thing on it, rather than a spotlight over a busy real screen.

   The full walkthrough over the real app still exists, replayed from Settings. */

const STEPS = ["hello", "write", "reveal", "notify", "account"];

/** The keyboard's height while it's up, 0 otherwise. The write step lays itself
    out against this directly: a KeyboardAvoidingView around a ScrollView left
    the answer box scrolled out of sight behind the button once the keyboard
    opened, which read as the box vanishing the moment you tried to type. */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (e) => setHeight(e.endCoordinates?.height || 0));
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return height;
}

function Dots({ index }) {
  return (
    <View style={styles.dots}>
      {STEPS.map((s, i) => (
        <View key={s} style={[styles.dot, i === index && styles.dotOn, i < index && styles.dotDone]} />
      ))}
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, icon }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[styles.primary, disabled && styles.primaryOff]}>
      {icon}
      <Text style={[styles.primaryLabel, disabled && { color: C.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

function TextButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.textBtn} hitSlop={8}>
      <Text style={styles.textBtnLabel}>{label}</Text>
    </Pressable>
  );
}

/** A page of the diary, as a card: who wrote it, and either the words or a seal. */
function Page({ who, text, sealed, sealedLabel, tint }) {
  return (
    <View style={[styles.page, { borderLeftColor: tint }]}>
      <Text style={styles.pageWho}>{who}</Text>
      {sealed ? (
        <View style={styles.sealedRow}>
          <Lock size={14} color={C.inkSoft} />
          <Text style={styles.sealedText}>{sealedLabel}</Text>
        </View>
      ) : (
        <Text style={styles.pageText}>{text}</Text>
      )}
    </View>
  );
}

export default function Onboarding() {
  const { isSignedIn, isLoaded } = useAuth();
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();

  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [inviteSeen, setInviteSeen] = useState(null);

  const fade = useRef(new Animated.Value(1)).current;
  const inputRef = useRef(null);
  const partnerFade = useRef(new Animated.Value(0)).current;

  const id = STEPS[step];
  const partner = t.demoPartnerName;

  useEffect(() => {
    if (isLoaded && !isSignedIn) track(EV.ONBOARDING_STEP_VIEWED, { step: id, step_index: step });
  }, [id, isLoaded, isSignedIn]); // eslint-disable-line

  useEffect(() => {
    if (isSignedIn) inviteScreenSeen().then(setInviteSeen);
  }, [isSignedIn]);

  /* Someone who already allowed notifications (a reinstall) shouldn't be asked
     again — switch the reminder on for them and move along. */
  useEffect(() => {
    if (id !== "notify") return;
    notificationAccess().then(async (access) => {
      if (access !== "granted") return;
      await enableReminderLocal({ t, source: "onboarding_already" });
      goTo(step + 1);
    });
  }, [id]); // eslint-disable-line

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (isSignedIn) {
    if (inviteSeen === null) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
    return <Redirect href={inviteSeen ? "/(tabs)/home" : "/invite"} />;
  }

  function goTo(next) {
    Keyboard.dismiss();
    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setStep(Math.min(next, STEPS.length - 1));
      Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
        if (STEPS[next] === "write") inputRef.current?.focus();
      });
    });
  }

  const openAuth = (cta) => {
    track(EV.SIGNIN_STARTED, { cta, step: id });
    if (cta === "create_account") track(EV.ONBOARDING_SIGNUP_OPENED);
    setAuthOpen(true);
  };

  const seal = async () => {
    const text = answer.trim();
    if (!text) return;
    await saveOnboardingAnswer({ dateIso: isoOf(new Date()), prompt: t.obPrompt, answer: text });
    track(EV.ONBOARDING_WROTE, { length: text.length });
    goTo(step + 1);
  };

  const reveal = () => {
    setRevealed(true);
    track(EV.ONBOARDING_REVEALED);
    Animated.timing(partnerFade, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const notify = async (provisional) => {
    setBusy(true);
    try {
      await enableReminderLocal({ t, provisional, source: provisional ? "onboarding_later" : "onboarding" });
    } finally {
      setBusy(false);
      goTo(step + 1);
    }
  };

  let body;
  let footer;

  if (id === "hello") {
    body = (
      <View style={styles.center}>
        <Image source={require("../assets/icon.png")} style={styles.logo} />
        <Text style={styles.wordmark}>Futari</Text>
        <View style={styles.helloPages}>
          <View style={[styles.miniPage, { transform: [{ rotate: "-5deg" }] }]}>
            <View style={[styles.miniLine, { width: "70%" }]} />
            <View style={[styles.miniLine, { width: "50%" }]} />
          </View>
          <View style={styles.helloHeart}>
            <Heart size={18} color="#fff" fill="#fff" />
          </View>
          <View style={[styles.miniPage, { transform: [{ rotate: "5deg" }] }]}>
            <View style={[styles.miniLine, { width: "60%" }]} />
            <View style={[styles.miniLine, { width: "75%" }]} />
          </View>
        </View>
        <Text style={styles.title}>{t.obHelloTitle}</Text>
        <Text style={styles.body}>{t.obHelloBody}</Text>
      </View>
    );
    footer = <PrimaryButton label={t.obHelloCta} onPress={() => goTo(1)} />;
  } else if (id === "write") {
    const typing = keyboard > 0;
    body = (
      <View style={{ flex: 1, gap: typing ? 10 : 14 }}>
        {!typing && <Text style={styles.kicker}>{t.obWriteLabel}</Text>}
        <Text style={typing ? styles.promptTyping : styles.prompt}>{t.obPrompt}</Text>
        <Pressable style={[styles.paper, typing && { flex: 1 }]} onPress={() => inputRef.current?.focus()}>
          <TextInput
            ref={inputRef}
            value={answer}
            onChangeText={setAnswer}
            placeholder={t.obWritePh}
            placeholderTextColor="#B3A794"
            multiline
            maxLength={280}
            scrollEnabled
            style={[styles.input, typing && { flex: 1, minHeight: 60 }]}
          />
        </Pressable>
        {!typing && <Text style={styles.hint}>{t.obWriteHint.replaceAll("{n}", partner)}</Text>}
      </View>
    );
    footer = <PrimaryButton label={t.obWriteCta} onPress={seal} disabled={!answer.trim()} icon={<Lock size={16} color={answer.trim() ? "#fff" : C.inkSoft} />} />;
  } else if (id === "reveal") {
    body = (
      <View style={{ gap: 14 }}>
        <Text style={styles.title}>{revealed ? t.obRevealAfterTitle : t.obRevealTitle}</Text>
        <Text style={styles.bodyLeft}>{revealed ? t.obRevealAfterBody : t.obRevealBody}</Text>
        <Text style={styles.promptSmall}>{t.obPrompt}</Text>
        <Page who={t.obRevealYou} text={answer.trim()} tint={C.pinkDeep} />
        {revealed ? (
          <Animated.View style={{ opacity: partnerFade, transform: [{ translateY: partnerFade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
            <Page who={partner} text={t.obPartnerAnswer} tint={C.green} />
          </Animated.View>
        ) : (
          <Page who={partner} sealed sealedLabel={t.obRevealSealed} tint={C.green} />
        )}
      </View>
    );
    footer = revealed ? (
      <PrimaryButton label={t.obNext} onPress={() => goTo(step + 1)} />
    ) : (
      <PrimaryButton label={t.obRevealCta} onPress={reveal} icon={<Heart size={16} color="#fff" fill="#fff" />} />
    );
  } else if (id === "notify") {
    body = (
      <View style={styles.center}>
        <View style={styles.bellCircle}>
          <Bell size={26} color={C.pinkText} />
        </View>
        <Text style={styles.title}>{t.obNotifTitle}</Text>
        <Text style={styles.body}>{t.obNotifBody}</Text>
        <View style={styles.banner}>
          <Image source={require("../assets/icon.png")} style={styles.bannerIcon} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.bannerApp}>FUTARI</Text>
              <Text style={styles.bannerTime}>{t.obNotifNow}</Text>
            </View>
            <Text style={styles.bannerTitle}>{t.notifPromptTitle}</Text>
            <Text style={styles.bannerBody} numberOfLines={2}>{t.obPrompt}</Text>
          </View>
        </View>
      </View>
    );
    footer = (
      <>
        <PrimaryButton label={t.obNotifCta} onPress={() => notify(false)} disabled={busy} icon={<Bell size={16} color="#fff" />} />
        <TextButton label={t.obNotifLater} onPress={() => (busy ? null : notify(true))} />
      </>
    );
  } else {
    body = (
      <View style={{ gap: 14 }}>
        <Text style={styles.title}>{t.obAccountTitle}</Text>
        <Text style={styles.bodyLeft}>{t.obAccountBody}</Text>
        {!!answer.trim() && (
          <>
            <Text style={styles.promptSmall}>{t.obPrompt}</Text>
            <Page who={t.obRevealYou} text={answer.trim()} tint={C.pinkDeep} />
          </>
        )}
      </View>
    );
    footer = (
      <>
        <PrimaryButton label={t.obAccountCta} onPress={() => openAuth("create_account")} />
        <Text style={styles.note}>{t.obAccountNote}</Text>
      </>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Dots index={step} />
        <Pressable onPress={() => openAuth("log_in")} hitSlop={10}>
          <Text style={styles.login}>{t.obLogIn}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingBottom: keyboard }}>
        <Animated.View style={{ flex: 1, opacity: fade }}>
          {id === "write" ? (
            <View style={[styles.content, { flex: 1, paddingTop: keyboard ? 8 : 20, paddingBottom: 12 }]}>{body}</View>
          ) : (
            <ScrollView
              contentContainerStyle={[styles.content, id === "hello" || id === "notify" ? { justifyContent: "center" } : null]}
              keyboardShouldPersistTaps="handled"
            >
              {body}
            </ScrollView>
          )}
          <View style={[styles.footer, { paddingBottom: keyboard ? 10 : Math.max(insets.bottom, 16) }]}>{footer}</View>
        </Animated.View>
      </View>

      <FloatingHearts active={revealed && id === "reveal"} />

      <Modal visible={authOpen} animationType="slide" onRequestClose={() => setAuthOpen(false)}>
        <AuthView onDismiss={() => setAuthOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, height: 36 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(120,100,70,0.18)" },
  dotOn: { width: 18, backgroundColor: C.pinkDeep },
  dotDone: { backgroundColor: C.pinkDeep },
  login: { fontFamily: fonts.bodyBold, fontSize: 14, color: C.inkSoft },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 24, maxWidth: 480, width: "100%", alignSelf: "center" },
  center: { alignItems: "center", gap: 14 },
  footer: { paddingHorizontal: 28, paddingTop: 8, gap: 4, maxWidth: 480, width: "100%", alignSelf: "center" },

  logo: { width: 52, height: 52, borderRadius: 14 },
  wordmark: { fontFamily: fonts.scriptBold, fontSize: 34, lineHeight: 50, paddingRight: 10, color: C.ink, marginTop: -6 },
  helloPages: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  miniPage: { width: 92, height: 112, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: "rgba(120,100,70,0.12)", padding: 12, gap: 9, justifyContent: "center" },
  miniLine: { height: 6, borderRadius: 3, backgroundColor: C.paperDeep },
  helloHeart: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.pinkDeep, alignItems: "center", justifyContent: "center" },

  title: { fontFamily: fonts.scriptBold, fontSize: 36, lineHeight: 46, paddingTop: 4, paddingRight: 12, color: C.ink, textAlign: "center" },
  body: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 24, color: C.inkSoft, textAlign: "center", maxWidth: 340 },
  bodyLeft: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 23, color: C.inkSoft, textAlign: "center" },
  kicker: { fontFamily: fonts.bodyExtraBold, fontSize: 11.5, letterSpacing: 1.4, color: C.pinkText, marginTop: 12 },
  prompt: { fontFamily: fonts.scriptSemiBold, fontSize: 32, lineHeight: 44, paddingRight: 10, color: C.ink },
  promptTyping: { fontFamily: fonts.scriptSemiBold, fontSize: 24, lineHeight: 34, paddingRight: 10, color: C.ink },
  promptSmall: { fontFamily: fonts.scriptSemiBold, fontSize: 22, lineHeight: 32, paddingRight: 8, color: C.ink, marginTop: 6 },
  paper: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: "rgba(120,100,70,0.12)", paddingHorizontal: 16, paddingVertical: 12 },
  input: { minHeight: 110, fontFamily: fonts.bodyRegular, fontSize: 16.5, lineHeight: 25, color: C.ink, textAlignVertical: "top" },
  hint: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 20, color: C.inkSoft },

  page: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: "rgba(120,100,70,0.10)", borderLeftWidth: 4, paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  pageWho: { fontFamily: fonts.bodyExtraBold, fontSize: 12, letterSpacing: 0.6, color: C.inkSoft },
  pageText: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 23, color: C.ink },
  sealedRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  sealedText: { fontFamily: fonts.bodyItalic, fontSize: 14, color: C.inkSoft },

  bellCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.pink, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  banner: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 18, padding: 12, width: "100%", maxWidth: 360, marginTop: 14, borderWidth: 1, borderColor: "rgba(120,100,70,0.08)" },
  bannerIcon: { width: 34, height: 34, borderRadius: 8 },
  bannerApp: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.5, color: C.inkSoft },
  bannerTime: { fontFamily: fonts.bodyRegular, fontSize: 11, color: C.inkSoft },
  bannerTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: C.ink, marginTop: 2 },
  bannerBody: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 19, color: C.ink },

  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 16 },
  primaryOff: { backgroundColor: "#E9DFD2" },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: "#fff" },
  textBtn: { alignItems: "center", paddingVertical: 12 },
  textBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: C.inkSoft },
  note: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: C.inkSoft, textAlign: "center", paddingVertical: 8 },
});
