import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";
import { ChevronLeft, Moon, Smile, Meh, Heart, Smile as SmileIcon, Clover, Share2 } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import SdBanner from "../../components/SdBanner";
import { PairFieldCards } from "../../components/FieldCard";
import ShareSheet from "../../components/ShareSheet";
import LockedPage from "../../components/LockedPage";
import { C, fonts, cardShadow } from "../../lib/theme";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";
import { useApp, fromIso } from "../../lib/appState";
import { pageTitle } from "../../lib/format";
import { promptFor, quizFor } from "../../lib/dailyContent";

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
  const { t, lang, getEntry, mode, me, refreshMe, partnerName, myName, describeQuizChoice, api, freeRevealsLeft } = useApp();
  const insets = useSafeAreaInsets();

  const e = getEntry(date);
  const d = fromIso(date);
  const title = pageTitle(d, t, lang);
  // Prefer the text stored on the entry itself — it's whatever was actually shown
  // the day this was written. Only fall back to recomputing for older entries saved
  // before that was tracked (or days nothing was ever written).
  const quizQ = quizFor(t, date, e);
  const prompt = promptFor(t, mode, date, e);
  const wroteSomething = !!(e.happy || e.mind || e.next || e.promptAnswer);

  const [shareOpen, setShareOpen] = useState(false);
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

  /* A past day both wrote but never opened — the free plan's waiting pages, or
     simply a day nobody tapped "open". Premium and the trial open it outright;
     the free plan spends its weekly open, and past that shows the locked card. */
  const canOpenPast = mode === "pair" && !!pastPairData && !pastPairData.revealed && wroteSomething && pastPairData.wrotePartner;
  const pastLocked = !!pastPairData?.locked && (freeRevealsLeft ?? 0) <= 0;
  const openPast = async () => {
    try {
      const res = await api.revealDay(me.pairSpaceId, date);
      if (res?.usedFreeReveal) track(EV.FREE_OPEN_USED, { where: "past" });
    } catch (err) {
      if (err.message !== "PREMIUM_REQUIRED") throw err;
      track(EV.PAYWALL_VIEWED, { source: "locked_page", where: "past" });
      router.push("/paywall");
    }
    refreshMe();
    setPastPairData(await api.getPairDay(me.pairSpaceId, date));
  };

  const MoodIcon = e.mood ? MOOD_ICONS[e.mood] : null;

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <PaperBg>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginLeft: -8 }}>
          <ChevronLeft size={22} color={C.inkSoft} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {wroteSomething && (
          <Pressable onPress={() => setShareOpen(true)} style={styles.shareBtn} accessibilityLabel={t.shareTitle}>
            <Share2 size={17} color={C.pinkText} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 40 }]}>
        <SdBanner dIso={date} />

        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
          <Text style={styles.promptText}>{prompt}</Text>
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

        {canOpenPast && (
          <View style={{ gap: 10 }}>
            <View style={styles.divider} />
            {pastLocked ? (
              <LockedPage where="past" />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Pressable onPress={openPast} style={styles.openBtn}>
                  <Heart size={16} color={C.pinkText} />
                  <Text style={styles.openBtnLabel}>{t.openPastPage.replace("{n}", partnerName)}</Text>
                </Pressable>
                {pastPairData.locked && <Text style={styles.freeOpenNote}>{t.freeOpenNote}</Text>}
              </View>
            )}
          </View>
        )}

        {mode === "pair" && (e.quizChoice || pastPairData?.partner?.quizChoice) && (
          <View style={styles.quizCard}>
            <Text style={styles.quizQ}>{quizQ}</Text>
            <View style={{ gap: 3 }}>
              <Text style={styles.quizAnswer}>
                {myName}: {describeQuizChoice(e.quizChoice, true)}
              </Text>
              <Text style={styles.quizAnswer}>
                {partnerName}: {describeQuizChoice(pastPairData?.partner?.quizChoice, false)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        entry={e}
        partner={pastPairData?.revealed ? pastPairData.partner : null}
        dateText={title}
        prompt={prompt}
      />
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  shareBtn: { marginLeft: "auto", width: 34, height: 34, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.pink },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 28, lineHeight: 42, paddingVertical: 3, paddingRight: 8, color: C.ink },
  body: { paddingHorizontal: 18, paddingTop: 8, gap: 14 },
  promptCard: { backgroundColor: C.pink, borderRadius: 20, padding: 18 },
  promptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1.2, color: C.pinkText, marginBottom: 4 },
  promptText: { fontFamily: fonts.scriptSemiBold, fontSize: 24, color: C.ink, lineHeight: 36, paddingVertical: 3, paddingRight: 7 },
  moodBadge: { width: 46, height: 46, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.pink, borderWidth: 2.5, borderColor: C.pinkDeep },
  divider: { height: 1, backgroundColor: C.cardBorder },
  openBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 30, backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.pinkDeep, ...cardShadow },
  openBtnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: C.pinkText },
  freeOpenNote: { fontFamily: fonts.bodyRegular, fontSize: 12, color: C.pinkText, marginTop: 7, textAlign: "center" },
  who: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: C.inkSoft },
  quizCard: { backgroundColor: C.pink, borderRadius: 20, padding: 18 },
  quizQ: { fontFamily: fonts.scriptSemiBold, fontSize: 21, color: C.ink, lineHeight: 32, paddingVertical: 3, paddingRight: 6, marginBottom: 10 },
  quizAnswer: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: "#A9798C" },
});
