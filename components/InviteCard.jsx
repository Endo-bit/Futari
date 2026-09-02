import { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Heart, Sun, Cloud } from "lucide-react-native";
import { C, fonts } from "../lib/theme";

/* The picture a friend receives. Same paper, same script headings and blush
   cards as a real page — the invite should look like the thing it is inviting
   you into, not like an ad for it.

   Fixed width so the capture is the same size on every phone. */
export const INVITE_CARD_WIDTH = 340;

function Ruled() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 24 }).map((_, i) => (
        <View key={i} style={[styles.rule, { top: i * 32 + 31 }]} />
      ))}
    </View>
  );
}

/** A miniature of a diary page, so the invite shows what the app actually is. */
function MiniPage({ t }) {
  return (
    <View style={styles.mini}>
      <View style={styles.miniPrompt}>
        <Text style={styles.miniPromptLabel}>{t.littlePrompt}</Text>
        <Text style={styles.miniPromptText} numberOfLines={2}>
          {t.inviteCardPrompt}
        </Text>
      </View>
      <View style={styles.miniRow}>
        <Sun size={12} color={C.sun} />
        <View style={[styles.miniBar, { width: "62%" }]} />
      </View>
      <View style={styles.miniRow}>
        <Cloud size={12} color={C.blue} />
        <View style={[styles.miniBar, { width: "44%" }]} />
      </View>
      <View style={styles.miniRow}>
        <Heart size={12} color={C.green} />
        <View style={[styles.miniBar, { width: "54%" }]} />
      </View>
    </View>
  );
}

const InviteCard = forwardRef(function InviteCard({ t, code }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Ruled />

      <View style={styles.header}>
        <Heart size={14} color={C.pinkText} fill={C.pinkText} />
        <Text style={styles.wordmark}>Futari</Text>
      </View>

      <Text style={styles.title}>{t.inviteCardTitle}</Text>
      <Text style={styles.sub}>{t.inviteCardSub}</Text>

      <MiniPage t={t} />

      {!!code && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>{t.inviteCardCodeLabel}</Text>
          <Text style={styles.code}>{code}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Heart size={11} color={C.pinkText} fill={C.pinkText} />
        <Text style={styles.footerNote}>{t.inviteCardFooter}</Text>
      </View>
    </View>
  );
});

export default InviteCard;

const styles = StyleSheet.create({
  card: {
    width: INVITE_CARD_WIDTH,
    backgroundColor: C.paper,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 10,
    overflow: "hidden",
  },
  rule: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: C.line },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  wordmark: { fontFamily: fonts.scriptBold, fontSize: 22, lineHeight: 33, paddingRight: 6, color: C.ink },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 27, lineHeight: 38, paddingRight: 8, color: C.ink },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13, lineHeight: 20, color: C.inkSoft },
  mini: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 13, gap: 9, marginTop: 2 },
  miniPrompt: { backgroundColor: C.pink, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10 },
  miniPromptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 8.5, letterSpacing: 1, color: C.pinkText, marginBottom: 3 },
  miniPromptText: { fontFamily: fonts.scriptSemiBold, fontSize: 17, lineHeight: 25, paddingRight: 5, color: C.ink },
  miniRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniBar: { height: 7, borderRadius: 999, backgroundColor: C.paperDeep },
  codeBox: { backgroundColor: C.greenSoft, borderRadius: 16, paddingVertical: 12, alignItems: "center" },
  codeLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 9.5, letterSpacing: 1.2, color: C.inkSoft },
  code: { fontFamily: fonts.scriptBold, fontSize: 32, lineHeight: 46, paddingRight: 8, letterSpacing: 5, color: C.ink },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 2 },
  footerNote: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: C.inkSoft },
});
