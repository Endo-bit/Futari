import { View, Text, Pressable, StyleSheet } from "react-native";
import KeyboardScrollView from "../KeyboardScrollView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import PaperBg from "../PaperBg";
import { C, fonts } from "../../lib/theme";

/* The frame every game screen shares: the ruled paper, a back arrow, a script
   title, and room for one primary action pinned at the bottom. Same paper and
   type as the diary, so the games read as part of it rather than a separate
   arcade bolted on. */
export default function PlayShell({ title, sub, children, footer, scroll = true, onBack }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const back = onBack || (() => (router.canGoBack() ? router.back() : router.replace("/play")));
  const Body = scroll ? KeyboardScrollView : View;
  return (
    <PaperBg>
      <View style={{ paddingTop: insets.top + 4, flex: 1 }}>
        <View style={styles.top}>
          <Pressable onPress={back} hitSlop={12} style={styles.backBtn} accessibilityRole="button">
            <ChevronLeft size={26} color={C.ink} />
          </Pressable>
        </View>
        <Body
          {...(scroll
            ? { style: { flex: 1 }, contentContainerStyle: styles.content }
            : { style: [{ flex: 1 }, styles.content] })}
        >
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!sub && <Text style={styles.sub}>{sub}</Text>}
          {children}
        </Body>
        {!!footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
      </View>
    </PaperBg>
  );
}

export function PlayButton({ label, onPress, disabled, icon, tone = "primary" }) {
  const primary = tone === "primary";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.btn, primary ? styles.btnPrimary : styles.btnGhost, disabled && styles.btnOff]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      {icon}
      <Text style={[styles.btnLabel, { color: disabled ? C.inkSoft : primary ? "#fff" : C.pinkText }]}>{label}</Text>
    </Pressable>
  );
}

export const playStyles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 16 },
  kicker: { fontFamily: fonts.bodyExtraBold, fontSize: 12.5, letterSpacing: 1.1, color: C.pinkText },
  big: { fontFamily: fonts.scriptBold, fontSize: 34, lineHeight: 44, paddingRight: 10, color: C.ink },
  body: { fontFamily: fonts.bodyRegular, fontSize: 16, lineHeight: 24, color: C.ink },
  soft: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 22, color: C.inkSoft },
});

const styles = StyleSheet.create({
  top: { height: 40, paddingHorizontal: 10, justifyContent: "center" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 22, paddingBottom: 28, gap: 14, maxWidth: 520, width: "100%", alignSelf: "center" },
  title: { fontFamily: fonts.scriptBold, fontSize: 36, lineHeight: 48, paddingRight: 12, color: C.ink },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 16, lineHeight: 24, color: C.inkSoft, marginTop: -8 },
  footer: { paddingHorizontal: 22, paddingTop: 10, gap: 8, maxWidth: 520, width: "100%", alignSelf: "center" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, paddingVertical: 15 },
  btnPrimary: { backgroundColor: C.pinkDeep },
  btnGhost: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.pinkDeep },
  btnOff: { backgroundColor: "#E9DFD2", borderWidth: 0 },
  btnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16.5 },
});
