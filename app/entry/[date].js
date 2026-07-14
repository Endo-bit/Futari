import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { ChevronLeft, Moon, Smile, Meh, Heart, Smile as SmileIcon, Clover } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import SdBanner from "../../components/SdBanner";
import { PairFieldCards } from "../../components/FieldCard";
import { C, fonts } from "../../lib/theme";
import { useApp, fromIso } from "../../lib/appState";
import { dayOfYear } from "../../lib/format";

function ReactionIcons({ ids }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {ids.map((id) => {
        const RIcon = { heart: Heart, smile: SmileIcon, clover: Clover }[id] || Heart;
        return <RIcon key={id} size={18} color={C.pinkText} fill={id === "heart" ? C.pinkText : "none"} />;
      })}
    </View>
  );
}

function ResponseCard({ name, reply, reactions, bg }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 16, padding: 14 }}>
      <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 12.5, color: C.ink, marginBottom: 6 }}>{name}</Text>
      {!!reply && <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 13, color: C.ink, marginBottom: 6, lineHeight: 19 }}>{reply}</Text>}
      {reactions?.length > 0 && <ReactionIcons ids={reactions} />}
    </View>
  );
}

const MOOD_ICONS = { smile: Smile, meh: Meh, zzz: Moon, love: Heart };

export default function EntryDetail() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { t, lang, getEntry, mode, me, partnerName, api } = useApp();
  const insets = useSafeAreaInsets();

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (!isSignedIn) return <Redirect href="/" />;

  const e = getEntry(date);
  const d = fromIso(date);
  const title = lang === "ja" ? `${d.getMonth() + 1}月${d.getDate()}日のページ` : `${t.pageOf} ${d.toLocaleDateString(lang)}`;

  const [pastPairData, setPastPairData] = useState(null);
  useEffect(() => {
    if (mode !== "pair" || !me?.pairSpaceId) {
      setPastPairData(null);
      return;
    }
    let cancelled = false;
    api.getPairDay(me.pairSpaceId, date).then((d2) => {
      if (!cancelled) setPastPairData(d2);
    });
    return () => {
      cancelled = true;
    };
  }, [date, mode, me?.pairSpaceId]); // eslint-disable-line

  const MoodIcon = e.mood ? MOOD_ICONS[e.mood] : null;

  return (
    <PaperBg>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginLeft: -8 }}>
          <ChevronLeft size={22} color={C.inkSoft} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 40 }]}>
        <SdBanner dIso={date} />

        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
          <Text style={styles.promptText}>{t.prompts[dayOfYear(d) % t.prompts.length]}</Text>
        </View>

        <PairFieldCards entry={e} t={t} />

        {MoodIcon && (
          <View style={{ alignItems: "center" }}>
            <View style={styles.moodBadge}>
              <MoodIcon size={21} color={C.pinkText} fill={e.mood === "love" ? C.pinkText : "none"} />
            </View>
          </View>
        )}

        {mode === "pair" && pastPairData?.revealed && (
          <View style={{ gap: 10 }}>
            <View style={styles.divider} />
            <Text style={styles.who}>{partnerName}</Text>
            <PairFieldCards entry={pastPairData.partner} t={t} />
            {(pastPairData.partnerReply || pastPairData.partnerReactions?.length > 0) && (
              <ResponseCard name={partnerName} reply={pastPairData.partnerReply} reactions={pastPairData.partnerReactions} bg={C.pink} />
            )}
            {(pastPairData.myReply || pastPairData.myReactions?.length > 0) && (
              <ResponseCard name={t.you} reply={pastPairData.myReply} reactions={pastPairData.myReactions} bg={C.greenSoft} />
            )}
          </View>
        )}
      </ScrollView>
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 28, lineHeight: 35, color: C.ink },
  body: { paddingHorizontal: 18, paddingTop: 8, gap: 14 },
  promptCard: { backgroundColor: C.pink, borderRadius: 20, padding: 18 },
  promptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1.2, color: C.pinkText, marginBottom: 4 },
  promptText: { fontFamily: fonts.scriptSemiBold, fontSize: 24, color: C.ink, lineHeight: 32 },
  moodBadge: { width: 46, height: 46, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.pink, borderWidth: 2.5, borderColor: C.pinkDeep },
  divider: { height: 1, backgroundColor: C.cardBorder },
  who: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: C.inkSoft },
});
