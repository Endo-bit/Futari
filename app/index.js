import { useMemo, useState } from "react";
import { View, Text, Image, Pressable, Modal, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { T, detectLang } from "../lib/i18n";
import { C, fonts } from "../lib/theme";

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const lang = useMemo(detectLang, []);
  const t = T[lang];
  const [authOpen, setAuthOpen] = useState(false);

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (isSignedIn) return <Redirect href="/(tabs)/home" />;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Image source={require("../assets/icon.png")} style={styles.logo} />
        <Text style={styles.title}>Futari</Text>
        <Text style={styles.tagline}>{t.landingTagline}</Text>

        <View style={styles.buttons}>
          <Pressable style={styles.primaryBtn} onPress={() => setAuthOpen(true)}>
            <Text style={styles.primaryBtnText}>{t.landingGetStarted}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setAuthOpen(true)}>
            <Text style={styles.secondaryBtnText}>{t.landingSignIn}</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={authOpen} animationType="slide" onRequestClose={() => setAuthOpen(false)}>
        <AuthView onDismiss={() => setAuthOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper, alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 430, alignItems: "center", paddingHorizontal: 32, gap: 22 },
  logo: { width: 56, height: 56, borderRadius: 14 },
  title: { fontFamily: fonts.scriptBold, fontSize: 46, lineHeight: 68, paddingVertical: 4, paddingRight: 12, color: C.ink },
  tagline: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 24, color: C.inkSoft, textAlign: "center", maxWidth: 320 },
  buttons: { width: "100%", maxWidth: 260, gap: 12, marginTop: 10 },
  primaryBtn: { backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 15, alignItems: "center" },
  primaryBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: "#fff" },
  secondaryBtn: { backgroundColor: "#fff", borderRadius: 999, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: C.pinkDeep },
  secondaryBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 15.5, color: C.pinkText },
});
