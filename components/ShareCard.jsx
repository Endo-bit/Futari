import { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sun, Cloud, Heart, Smile, Meh, Moon } from "lucide-react-native";
import { C, fonts } from "../lib/theme";

/* The image a day gets shared as. Fixed width so the capture is a predictable size
   whatever phone it renders on, and laid out to read as a torn-out page of the same
   paper the app is written on: ruled background, blush cards, script headings. */
export const SHARE_CARD_WIDTH = 340;

const MOOD_ICONS = { smile: Smile, meh: Meh, zzz: Moon, love: Heart };

function Ruled() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 40 }).map((_, i) => (
        <View key={i} style={[styles.rule, { top: i * 32 + 31 }]} />
      ))}
    </View>
  );
}

function Field({ icon, tag, tc, text }) {
  if (!text) return null;
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        {icon}
        <Text style={[styles.fieldTag, { color: tc }]}>{tag}</Text>
      </View>
      <Text style={styles.fieldText}>{text}</Text>
    </View>
  );
}

function Side({ entry, t }) {
  return (
    <>
      <Field icon={<Sun size={13} color={C.sun} />} tag={t.tagHappy} tc={C.sun} text={entry?.happy} />
      <Field icon={<Cloud size={13} color={C.blue} />} tag={t.tagMind} tc={C.blue} text={entry?.mind} />
      <Field icon={<Heart size={13} color={C.green} />} tag={t.tagNext} tc={C.green} text={entry?.next} />
    </>
  );
}

/**
 * @param entry      the viewer's own entry for the day
 * @param partner    the partner's entry, or null when it isn't being included
 * @param dateText   the day, already formatted for the current language
 */
const ShareCard = forwardRef(function ShareCard(
  { entry, partner, partnerName, myName, dateText, prompt, t, includePartner },
  ref
) {
  const MoodIcon = entry?.mood ? MOOD_ICONS[entry.mood] : null;
  const showPartner = includePartner && !!partner && !!(partner.promptAnswer || partner.happy || partner.mind || partner.next);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Ruled />

      <View style={styles.header}>
        <Heart size={13} color={C.pinkText} fill={C.pinkText} />
        <Text style={styles.wordmark}>Futari</Text>
        <Text style={styles.date}>{dateText}</Text>
      </View>

      {!!prompt && (
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
          <Text style={styles.promptText}>{prompt}</Text>
          {!!entry?.promptAnswer && <Text style={styles.promptAnswer}>{entry.promptAnswer}</Text>}
        </View>
      )}

      {showPartner ? (
        <>
          <Text style={styles.who}>{myName}</Text>
          <Side entry={entry} t={t} />
          <View style={styles.divider} />
          <Text style={styles.who}>{partnerName}</Text>
          {!!partner.promptAnswer && (
            <Field icon={<Heart size={13} color={C.pinkText} />} tag={t.littlePrompt} tc={C.pinkText} text={partner.promptAnswer} />
          )}
          <Side entry={partner} t={t} />
        </>
      ) : (
        <Side entry={entry} t={t} />
      )}

      <View style={styles.footer}>
        {MoodIcon ? (
          <View style={styles.moodBadge}>
            <MoodIcon size={15} color={C.pinkText} fill={entry.mood === "love" ? C.pinkText : "none"} />
          </View>
        ) : (
          <View />
        )}
        <Text style={styles.footerNote}>{t.shareFooter}</Text>
      </View>
    </View>
  );
});

export default ShareCard;

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    backgroundColor: C.paper,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
    overflow: "hidden",
  },
  rule: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: C.line },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  wordmark: { fontFamily: fonts.scriptBold, fontSize: 22, lineHeight: 33, paddingRight: 6, color: C.ink },
  date: { marginLeft: "auto", fontFamily: fonts.bodyExtraBold, fontSize: 11.5, color: C.pinkText },
  promptCard: { backgroundColor: C.pink, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 13 },
  promptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 9.5, letterSpacing: 1.1, color: C.pinkText, marginBottom: 3 },
  promptText: { fontFamily: fonts.scriptSemiBold, fontSize: 20, lineHeight: 30, paddingRight: 6, color: C.ink },
  promptAnswer: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 19, color: C.ink, marginTop: 6 },
  who: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 0.8, color: C.inkSoft, marginTop: 2 },
  field: { backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 14, paddingVertical: 12 },
  fieldHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  fieldTag: { fontFamily: fonts.bodyExtraBold, fontSize: 9.5, letterSpacing: 1 },
  fieldText: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 19, color: C.ink },
  divider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 2 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  moodBadge: { width: 30, height: 30, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.pink, borderWidth: 2, borderColor: C.pinkDeep },
  footerNote: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: C.inkSoft },
});
