import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { useAuth } from "../../lib/auth";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* The sign-in sheet: Apple, Google, or email + password. Replaces Clerk's
   prebuilt native view; same paper, type and buttons as the rest of the app. */

function errorText(err, t) {
  const code = err?.code || err?.message || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login|INVALID/.test(code)) return t.auErrInvalid;
  if (/email-already-in-use/.test(code)) return t.auErrEmailInUse;
  if (/weak-password/.test(code)) return t.auErrWeak;
  if (/invalid-email/.test(code)) return t.auErrEmail;
  if (/network|HTTP_5|Failed to fetch|timeout/i.test(code)) return t.auErrNet;
  return t.auErrGeneric;
}

export default function SignInSheet({ visible, onClose, initialMode = "signUp" }) {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const auth = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const run = async (which, fn) => {
    setBusy(which);
    setError(null);
    setNotice(null);
    try {
      const ok = await fn();
      if (ok !== false) {
        track(EV.SIGNIN_COMPLETED, { method: which });
        onClose?.();
      }
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(null);
    }
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailOk && password.length >= 6 && !busy;

  const submit = () =>
    run("email", async () => {
      if (mode === "signUp") await auth.signUpEmail(email, password, name);
      else await auth.signInEmail(email, password);
    });

  const forgot = async () => {
    if (!emailOk) {
      setError(t.auErrEmail);
      return;
    }
    setBusy("reset");
    setError(null);
    try {
      await auth.resetPassword(email);
      setNotice(t.auResetSent.replace("{e}", email.trim()));
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.plBack}>
            <X size={24} color={C.inkSoft} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <Text style={styles.title}>{mode === "signUp" ? t.auTitleSignUp : t.auTitleSignIn}</Text>
          <Text style={styles.sub}>{t.auSub}</Text>

          {auth.appleAvailable && (
            <Pressable onPress={() => run("apple", auth.signInApple)} style={[styles.social, styles.apple]} disabled={!!busy} accessibilityRole="button">
              {busy === "apple" ? <ActivityIndicator color="#fff" /> : <Text style={[styles.socialLabel, { color: "#fff" }]}> {t.auApple}</Text>}
            </Pressable>
          )}
          {auth.googleAvailable && (
            <Pressable onPress={() => run("google", auth.signInGoogle)} style={[styles.social, styles.google]} disabled={!!busy} accessibilityRole="button">
              {busy === "google" ? <ActivityIndicator color={C.ink} /> : <Text style={styles.socialLabel}>G  {t.auGoogle}</Text>}
            </Pressable>
          )}

          {(auth.appleAvailable || auth.googleAvailable) && (
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>{t.auOr}</Text>
              <View style={styles.orLine} />
            </View>
          )}

          {mode === "signUp" && (
            <TextInput style={styles.input} placeholder={t.auName} placeholderTextColor="#9C907F" value={name} onChangeText={setName} maxLength={40} textContentType="givenName" autoComplete="name-given" />
          )}
          <TextInput
            style={styles.input}
            placeholder={t.auEmail}
            placeholderTextColor="#9C907F"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder={t.auPassword}
            placeholderTextColor="#9C907F"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType={mode === "signUp" ? "newPassword" : "password"}
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
            onSubmitEditing={canSubmit ? submit : undefined}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!notice && <Text style={styles.notice}>{notice}</Text>}

          <Pressable onPress={canSubmit ? submit : undefined} style={[styles.primary, !canSubmit && styles.primaryOff]} accessibilityRole="button" accessibilityState={{ disabled: !canSubmit }}>
            {busy === "email" ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryLabel, !canSubmit && { color: C.inkSoft }]}>{mode === "signUp" ? t.auSignUp : t.auSignIn}</Text>}
          </Pressable>

          {mode === "signIn" && (
            <Pressable onPress={forgot} hitSlop={8} style={styles.linkBtn} disabled={busy === "reset"}>
              <Text style={styles.link}>{t.auForgot}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              setMode(mode === "signUp" ? "signIn" : "signUp");
              setError(null);
              setNotice(null);
            }}
            hitSlop={8}
            style={styles.linkBtn}
          >
            <Text style={[styles.link, { color: C.pinkText }]}>{mode === "signUp" ? t.auToSignIn : t.auToSignUp}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  top: { height: 52, justifyContent: "center", paddingHorizontal: 18, paddingTop: Platform.OS === "android" ? 10 : 0 },
  content: { paddingHorizontal: 24, paddingBottom: 30, gap: 12, maxWidth: 480, width: "100%", alignSelf: "center" },
  title: { fontFamily: fonts.scriptBold, fontSize: 36, lineHeight: 48, paddingRight: 10, color: C.ink },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 23, color: C.inkSoft, marginTop: -6, marginBottom: 6 },
  social: { borderRadius: 999, paddingVertical: 15, alignItems: "center", justifyContent: "center", minHeight: 52 },
  apple: { backgroundColor: "#000" },
  google: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.cardBorder },
  socialLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16.5, color: C.ink },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: C.cardBorder },
  orText: { fontFamily: fonts.bodyBold, fontSize: 14, color: C.inkSoft },
  input: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.bodyRegular, fontSize: 16.5, color: C.ink },
  error: { fontFamily: fonts.bodyBold, fontSize: 15, color: "#B0413E" },
  notice: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.pinkText },
  primary: { borderRadius: 999, paddingVertical: 16, alignItems: "center", backgroundColor: C.pinkDeep, minHeight: 54, justifyContent: "center", marginTop: 4 },
  primaryOff: { backgroundColor: "#E9DFD2" },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16.5, color: "#fff" },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.inkSoft },
});
