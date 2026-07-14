import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Heart, PenLine, Check } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import ModeToggle from "../../components/ModeToggle";
import SaveButton from "../../components/SaveButton";
import DateField from "../../components/DateField";
import { C, fonts, cardShadow } from "../../lib/theme";
import { useApp, fromIso } from "../../lib/appState";
import { dayOfYear } from "../../lib/format";

export default function HomeScreen() {
  const router = useRouter();
  const { t, lang, today, todayIso, me, setMe, mode, api, streak, pairToday, refreshPairToday, partnerName, showToast } = useApp();
  const [startDateFormOpen, setStartDateFormOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(me?.startDate || null);

  const [myGoal, setMyGoal] = useState("");
  const [myNext, setMyNext] = useState("");
  useEffect(() => {
    if (!me?.personalSpaceId) return;
    AsyncStorage.getItem(`futari_my_goal_${me.personalSpaceId}`).then((v) => setMyGoal(v || ""));
    AsyncStorage.getItem(`futari_my_next_${me.personalSpaceId}`).then((v) => setMyNext(v || ""));
  }, [me?.personalSpaceId]);

  const saveMyGoal = (text) => {
    setMyGoal(text);
    if (me?.personalSpaceId) AsyncStorage.setItem(`futari_my_goal_${me.personalSpaceId}`, text).catch(() => {});
  };
  const saveMyNext = (text) => {
    setMyNext(text);
    if (me?.personalSpaceId) AsyncStorage.setItem(`futari_my_next_${me.personalSpaceId}`, text).catch(() => {});
  };

  const prompt = t.prompts[dayOfYear(today) % t.prompts.length];
  const quizQ = t.coupleQuestions[dayOfYear(today) % t.coupleQuestions.length];
  const showCouple = mode === "pair" && !!me?.pairId;
  const daysTogether = me?.startDate ? Math.floor((today - fromIso(me.startDate)) / 86400000) : null;

  const myQuiz = pairToday?.mine?.quizChoice || null;
  const partnerQuiz = pairToday?.partner?.quizChoice || null;
  const myPromptAnswer = pairToday?.mine?.promptAnswer || "";
  const partnerPromptAnswer = pairToday?.partner?.promptAnswer || "";
  const showPromptAnswers = showCouple && !!pairToday?.revealed && (!!myPromptAnswer || !!partnerPromptAnswer);
  const renderChoice = (choice, isMine) => {
    if (!choice) return t.homeNotAnswered;
    if (isMine) return choice === "me" ? t.me : partnerName;
    return choice === "me" ? partnerName : t.me;
  };

  const answerQuiz = async (choice) => {
    if (!me?.pairSpaceId) return;
    await api.saveEntry(me.pairSpaceId, todayIso, { quizChoice: choice });
    refreshPairToday();
  };

  const confirmStartDate = async () => {
    if (!draftStartDate) return;
    await api.saveStartDate(draftStartDate);
    setMe((prev) => (prev ? { ...prev, startDate: draftStartDate } : prev));
    setStartDateFormOpen(false);
    showToast(t.savedToast);
  };

  const saveSharedGoal = async (text) => {
    await api.saveSharedGoal(text);
    setMe((prev) => (prev ? { ...prev, sharedGoal: text } : prev));
  };
  const saveNextPlan = async (text) => {
    await api.saveNextPlan(text);
    setMe((prev) => (prev ? { ...prev, nextPlan: text } : prev));
  };

  return (
    <PaperBg>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>{t.tabHome}</Text>
        </View>

        <View style={styles.section}>
          <ModeToggle />
        </View>

        <View style={[styles.section, { gap: 14 }]}>
          {showCouple && (
            <View style={styles.togetherCard}>
              <Pressable style={styles.editBtn} onPress={() => setStartDateFormOpen((o) => !o)}>
                <PenLine size={14} color={C.pinkText} />
              </Pressable>
              <Text style={styles.togetherLabel}>{t.homeTogetherLabel}</Text>
              {daysTogether !== null ? (
                <>
                  <Text style={styles.togetherNumber}>{daysTogether}</Text>
                  <Text style={styles.togetherSince}>
                    {t.homeSinceLabel.replace("{d}", new Date(me.startDate + "T00:00:00").toLocaleDateString(lang))}
                  </Text>
                </>
              ) : (
                <Pressable style={styles.setDateBtn} onPress={() => setStartDateFormOpen(true)}>
                  <Text style={styles.setDateLabel}>{t.homeSetStartDate}</Text>
                </Pressable>
              )}

              {startDateFormOpen && (
                <View style={styles.startDateForm}>
                  <DateField value={draftStartDate} onChange={setDraftStartDate} placeholder={t.homeSetStartDate} maximumDate={today} />
                  <View style={{ marginTop: 10 }}>
                    <SaveButton onPress={confirmStartDate} disabled={!draftStartDate} label={t.save} icon={<Check size={16} color="#fff" />} />
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.streakCard}>
            <Heart size={16} color={C.green} fill={C.green} />
            <Text style={styles.streakText}>
              {streak} {t.streak}
            </Text>
          </View>

          {showCouple && (
            <View style={styles.quizCard}>
              <Text style={styles.quizQ}>{quizQ}</Text>
              <View style={styles.quizRow}>
                {["me", "partner"].map((choice) => {
                  const sel = myQuiz === choice;
                  return (
                    <Pressable key={choice} onPress={() => answerQuiz(choice)} style={[styles.quizBtn, sel && styles.quizBtnSel]}>
                      <Text style={[styles.quizBtnLabel, { color: sel ? "#fff" : C.ink }]}>
                        {choice === "me" ? t.me : partnerName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ gap: 3 }}>
                <Text style={styles.quizAnswer}>
                  {t.me}: {renderChoice(myQuiz, true)}
                </Text>
                <Text style={styles.quizAnswer}>
                  {partnerName}: {renderChoice(partnerQuiz, false)}
                </Text>
              </View>
            </View>
          )}

          {showCouple && (
            <>
              <View style={styles.textCard}>
                <Text style={styles.textCardLabel}>{t.homeGoalLabel}</Text>
                <TextInput
                  key={"goal-" + me.pairId}
                  defaultValue={me.sharedGoal || ""}
                  onBlur={(ev) => {
                    if (ev.nativeEvent.text !== (me.sharedGoal || "")) saveSharedGoal(ev.nativeEvent.text);
                  }}
                  placeholder={t.homeGoalPh}
                  placeholderTextColor="#B3A794"
                  multiline
                  style={styles.textarea}
                />
              </View>
              <View style={styles.textCard}>
                <Text style={styles.textCardLabel}>{t.homePlanLabel}</Text>
                <TextInput
                  key={"plan-" + me.pairId}
                  defaultValue={me.nextPlan || ""}
                  onBlur={(ev) => {
                    if (ev.nativeEvent.text !== (me.nextPlan || "")) saveNextPlan(ev.nativeEvent.text);
                  }}
                  placeholder={t.homePlanPh}
                  placeholderTextColor="#B3A794"
                  multiline
                  style={styles.textarea}
                />
              </View>
            </>
          )}

          {mode === "personal" && (
            <>
              <View style={styles.textCard}>
                <Text style={styles.textCardLabel}>{t.homeMyGoalLabel}</Text>
                <TextInput
                  key={"my-goal-" + (me?.personalSpaceId || "")}
                  defaultValue={myGoal}
                  onBlur={(ev) => {
                    if (ev.nativeEvent.text !== myGoal) saveMyGoal(ev.nativeEvent.text);
                  }}
                  placeholder={t.homeMyGoalPh}
                  placeholderTextColor="#B3A794"
                  multiline
                  style={styles.textarea}
                />
              </View>
              <View style={styles.textCard}>
                <Text style={styles.textCardLabel}>{t.homeMyNextLabel}</Text>
                <TextInput
                  key={"my-next-" + (me?.personalSpaceId || "")}
                  defaultValue={myNext}
                  onBlur={(ev) => {
                    if (ev.nativeEvent.text !== myNext) saveMyNext(ev.nativeEvent.text);
                  }}
                  placeholder={t.homeMyNextPh}
                  placeholderTextColor="#B3A794"
                  multiline
                  style={styles.textarea}
                />
              </View>
            </>
          )}

          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
            <Text style={styles.promptText}>{prompt}</Text>
            {showPromptAnswers && (
              <View style={styles.promptAnswers}>
                {!!myPromptAnswer && (
                  <Text style={styles.promptAnswerLine}>
                    <Text style={styles.promptAnswerWho}>{t.me}: </Text>
                    {myPromptAnswer}
                  </Text>
                )}
                {!!partnerPromptAnswer && (
                  <Text style={styles.promptAnswerLine}>
                    <Text style={styles.promptAnswerWho}>{partnerName}: </Text>
                    {partnerPromptAnswer}
                  </Text>
                )}
              </View>
            )}
            <View style={{ marginTop: 14 }}>
              <SaveButton onPress={() => router.push("/(tabs)/today")} label={t.homeWriteCta} icon={<PenLine size={16} color="#fff" />} />
            </View>
          </View>
        </View>
      </ScrollView>
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  h1: { fontFamily: fonts.scriptSemiBold, fontSize: 34, lineHeight: 50, paddingVertical: 4, color: C.ink },
  section: { paddingHorizontal: 18, paddingTop: 10 },
  togetherCard: {
    position: "relative",
    alignItems: "center",
    backgroundColor: C.pink,
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 20,
    ...cardShadow,
  },
  editBtn: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 999, width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  togetherLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11.5, letterSpacing: 1.5, color: C.pinkText, textTransform: "uppercase", marginBottom: 6 },
  togetherNumber: { fontFamily: fonts.scriptBold, fontSize: 56, color: C.ink, lineHeight: 84, paddingVertical: 4 },
  togetherSince: { fontFamily: fonts.bodyRegular, fontSize: 13, color: C.inkSoft, marginTop: 6 },
  setDateBtn: { marginTop: 6, backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  setDateLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: "#fff" },
  startDateForm: { marginTop: 16, backgroundColor: "#fff", borderRadius: 16, padding: 12, width: "100%" },
  streakCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  streakText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: C.ink },
  quizCard: { backgroundColor: C.pink, borderRadius: 20, padding: 18 },
  quizQ: { fontFamily: fonts.scriptSemiBold, fontSize: 21, color: C.ink, lineHeight: 32, paddingVertical: 3, marginBottom: 10 },
  quizRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  quizBtn: { flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: "center", backgroundColor: "#fff" },
  quizBtnSel: { backgroundColor: C.pinkDeep },
  quizBtnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 13 },
  quizAnswer: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: "#A9798C" },
  textCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  textCardLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1.2, color: C.inkSoft, marginBottom: 8 },
  textarea: { minHeight: 50, backgroundColor: "#fff", borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 12, fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.ink, textAlignVertical: "top" },
  promptCard: { backgroundColor: C.greenSoft, borderRadius: 20, padding: 18 },
  promptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1.2, color: C.inkSoft, marginBottom: 4 },
  promptText: { fontFamily: fonts.scriptSemiBold, fontSize: 24, color: C.ink, lineHeight: 36, paddingVertical: 3 },
  promptAnswers: { marginTop: 12, gap: 6 },
  promptAnswerLine: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.ink, lineHeight: 19 },
  promptAnswerWho: { fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: C.inkSoft },
});
