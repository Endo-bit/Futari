import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Sun, Cloud, Heart, Smile, Clover, Check } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import ModeToggle from "../../components/ModeToggle";
import SaveButton from "../../components/SaveButton";
import BlockCard from "../../components/BlockCard";
import MoodPicker from "../../components/MoodPicker";
import SdBanner from "../../components/SdBanner";
import PairingPrompt from "../../components/PairingPrompt";
import InlineEditor from "../../components/InlineEditor";
import MindEditor from "../../components/MindEditor";
import FloatingHearts from "../../components/FloatingHearts";
import { PairFieldCards } from "../../components/FieldCard";
import { C, fonts, cardShadow } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { dayOfYear, dateLabel } from "../../lib/format";

function ReactionIcons({ ids }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {ids.map((id) => {
        const RIcon = { heart: Heart, smile: Smile, clover: Clover }[id] || Heart;
        return <RIcon key={id} size={18} color={C.pinkText} fill={id === "heart" ? C.pinkText : "none"} />;
      })}
    </View>
  );
}

function ResponseCard({ name, reply, reactions, bg }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 16, padding: 14 }}>
      <Text style={styles.responseName}>{name}</Text>
      {!!reply && <Text style={styles.responseReply}>{reply}</Text>}
      {reactions?.length > 0 && <ReactionIcons ids={reactions} />}
    </View>
  );
}

export default function TodayScreen() {
  const { t, lang, today, todayIso, me, mode, api, getEntry, patchEntry, pairToday, refreshPairToday, partnerName, showToast } =
    useApp();

  const [editingField, setEditingField] = useState(null);
  const [mindOpen, setMindOpen] = useState(false);
  const [draftReactions, setDraftReactions] = useState([]);
  const [draftReply, setDraftReply] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [hearts, setHearts] = useState(false);

  const e = getEntry(todayIso);
  const prompt = t.prompts[dayOfYear(today) % t.prompts.length];
  const wrote = !!(e.happy || e.mind || e.next || e.promptAnswer);
  const revealed = mode === "pair" && !!pairToday?.revealed;
  const alreadySent = !!((pairToday?.myReactions || []).length || pairToday?.myReply);
  const wrotePartner = !!pairToday?.wrotePartner;
  const canReveal = wrote && wrotePartner;

  const doReveal = async () => {
    if (!me?.pairSpaceId) return;
    await api.revealDay(me.pairSpaceId, todayIso);
    await refreshPairToday();
    setHearts(true);
    showToast(t.revealedToast, "heart");
    setTimeout(() => setHearts(false), 2400);
  };

  const toggleDraftReaction = (id) => {
    setDraftReactions((rs) => (rs.includes(id) ? rs.filter((x) => x !== id) : [...rs, id]));
  };

  const handleSendResponse = async () => {
    if (!me?.pairSpaceId) return;
    setSendingResponse(true);
    try {
      await api.submitResponse(me.pairSpaceId, todayIso, { reactions: draftReactions, reply: draftReply.trim() });
      await refreshPairToday();
      setDraftReactions([]);
      setDraftReply("");
      showToast(t.responseSent.replace("{n}", partnerName), "heart");
    } catch (err) {
      showToast(err.message, "info");
    } finally {
      setSendingResponse(false);
    }
  };

  const revealLabel = !wrote
    ? t.revealHint.replace("{n}", partnerName)
    : !wrotePartner
    ? t.waitingPartner.replace("{n}", partnerName)
    : t.renWrote.replace("{n}", partnerName);

  return (
    <PaperBg style={{ position: "relative" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>{t.todaysPage}</Text>
          <Text style={styles.dateLabel}>{dateLabel(today, t, lang)}</Text>
        </View>

        <View style={styles.section}>
          <ModeToggle />
        </View>

        <View style={[styles.section, { gap: 14 }]}>
          {mode === "pair" && !me?.pairId ? (
            <PairingPrompt />
          ) : (
            <>
              <SdBanner dIso={todayIso} />

              {revealed ? (
                <>
                  <View style={styles.promptCard}>
                    <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </View>

                  <Text style={styles.who}>{t.you}</Text>
                  <PairFieldCards entry={e} t={t} />

                  <View style={styles.divider} />
                  <Text style={styles.who}>{partnerName}</Text>
                  <PairFieldCards entry={pairToday.partner} t={t} />

                  {(pairToday.partnerReply || pairToday.partnerReactions?.length > 0) && (
                    <ResponseCard name={partnerName} reply={pairToday.partnerReply} reactions={pairToday.partnerReactions} bg={C.pink} />
                  )}

                  {alreadySent ? (
                    <ResponseCard name={t.you} reply={pairToday.myReply} reactions={pairToday.myReactions} bg={C.greenSoft} />
                  ) : (
                    <View style={styles.composer}>
                      {!!pairToday.partner?.mind && (
                        <>
                          <Text style={styles.receiveTitle}>{t.receiveTitle}</Text>
                          <View style={{ gap: 8, marginBottom: 10 }}>
                            {t.receivePhrases.map((p, i) => {
                              const sel = draftReply === p;
                              return (
                                <Pressable key={i} onPress={() => setDraftReply(p)} style={[styles.phraseBtn, sel && styles.phraseBtnSel]}>
                                  <Text style={[styles.phraseLabel, { color: sel ? "#fff" : C.ink }]}>{p}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </>
                      )}
                      <TextInput
                        value={draftReply}
                        onChangeText={setDraftReply}
                        placeholder={t.replyPh}
                        placeholderTextColor="#B3A794"
                        multiline
                        style={styles.replyInput}
                      />
                      <View style={styles.reactionRow}>
                        {[
                          { id: "heart", Icon: Heart, fg: "#E05C7A" },
                          { id: "smile", Icon: Smile, fg: C.ink },
                          { id: "clover", Icon: Clover, fg: C.ink },
                        ].map(({ id, Icon, fg }) => {
                          const on = draftReactions.includes(id);
                          return (
                            <Pressable key={id} onPress={() => toggleDraftReaction(id)} style={[styles.reactionBtn, on && styles.reactionBtnOn]}>
                              <Icon size={20} color={fg} fill={on && id === "heart" ? fg : "none"} />
                            </Pressable>
                          );
                        })}
                      </View>
                      <SaveButton
                        onPress={handleSendResponse}
                        disabled={sendingResponse || (!draftReactions.length && !draftReply.trim())}
                        label={t.sendToPartner.replace("{n}", partnerName)}
                        icon={<Heart size={18} color="#fff" fill="#fff" />}
                      />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.promptCard}>
                    <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
                    <Text style={styles.promptText}>{prompt}</Text>
                    <TextInput
                      key={todayIso}
                      defaultValue={e.promptAnswer}
                      onBlur={(ev) => {
                        if (ev.nativeEvent.text !== e.promptAnswer) patchEntry(todayIso, { promptAnswer: ev.nativeEvent.text });
                      }}
                      placeholder={t.promptAnswerPh}
                      placeholderTextColor="#B3A794"
                      multiline
                      style={styles.promptInput}
                    />
                  </View>

                  <BlockCard icon={<Sun size={19} color={C.sun} />} title={t.happy} text={e.happy} placeholder={t.happyPh} onPress={() => setEditingField("happy")} />
                  <BlockCard icon={<Cloud size={19} color={C.blue} />} title={t.mind} text={e.mind} placeholder={t.mindPh} onPress={() => setMindOpen(true)} />
                  <BlockCard
                    icon={<Heart size={19} color={C.green} />}
                    title={mode === "personal" ? t.nextSolo : t.next}
                    text={e.next}
                    placeholder={mode === "personal" ? t.nextSoloPh : t.nextPh}
                    onPress={() => setEditingField("next")}
                  />

                  <MoodPicker
                    value={e.mood}
                    label={t.mood}
                    onChange={(id) => {
                      patchEntry(todayIso, { mood: id });
                      if (id) showToast(t.moodToast, "heart");
                    }}
                  />

                  <SaveButton onPress={() => showToast(t.savedToast)} label={t.save} icon={<Check size={18} color="#fff" />} />

                  {mode === "pair" && me?.pairSpaceId && (
                    <View style={{ alignItems: "center", marginTop: 2 }}>
                      <Text style={styles.revealLabel}>{revealLabel}</Text>
                      <Pressable disabled={!canReveal} onPress={doReveal} style={[styles.revealBtn, canReveal ? styles.revealBtnOn : styles.revealBtnOff]}>
                        <Heart size={16} color={canReveal ? C.pinkText : C.inkSoft} />
                        <Text style={[styles.revealBtnLabel, { color: canReveal ? C.pinkText : C.inkSoft }]}>{t.reveal}</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <FloatingHearts active={hearts} />

      <InlineEditor
        visible={!!editingField}
        field={editingField}
        initialValue={editingField ? e[editingField] : ""}
        onSave={(text) => {
          patchEntry(todayIso, { [editingField]: text });
          if (text) showToast(t.savedToast);
        }}
        onClose={() => setEditingField(null)}
      />
      <MindEditor
        visible={mindOpen}
        initialValue={e.mind}
        initialTag={e.mindTag}
        onSave={(text, tag) => {
          patchEntry(todayIso, { mind: text, mindTag: tag });
          if (text) showToast(t.savedToast);
        }}
        onClose={() => setMindOpen(false)}
      />
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6, gap: 4 },
  h1: { fontFamily: fonts.scriptSemiBold, fontSize: 34, lineHeight: 50, paddingVertical: 4, paddingRight: 10, color: C.ink, flex: 1 },
  dateLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: C.pinkText },
  section: { paddingHorizontal: 18, paddingTop: 8 },
  promptCard: { backgroundColor: C.pink, borderRadius: 20, padding: 18 },
  promptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1.2, color: C.pinkText, marginBottom: 4 },
  promptText: { fontFamily: fonts.scriptSemiBold, fontSize: 24, color: C.ink, lineHeight: 36, paddingVertical: 3, paddingRight: 7 },
  promptInput: { marginTop: 10, minHeight: 60, backgroundColor: "#fff", borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 12, fontFamily: fonts.bodyRegular, fontSize: 14, color: C.ink, textAlignVertical: "top" },
  who: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: C.inkSoft },
  divider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 6 },
  composer: { backgroundColor: C.greenSoft, borderRadius: 18, padding: 16 },
  receiveTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: C.ink, marginBottom: 9 },
  phraseBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  phraseBtnSel: { backgroundColor: C.green },
  phraseLabel: { fontFamily: fonts.bodyRegular, fontSize: 13.5 },
  replyInput: { minHeight: 70, backgroundColor: "#fff", borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 12, fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.ink, textAlignVertical: "top" },
  reactionRow: { flexDirection: "row", justifyContent: "center", gap: 16, paddingVertical: 16 },
  reactionBtn: { width: 52, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  reactionBtnOn: { borderWidth: 2, borderColor: C.pinkDeep },
  revealLabel: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: C.inkSoft, marginBottom: 8, textAlign: "center" },
  revealBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 32 },
  revealBtnOn: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.pinkDeep, ...cardShadow },
  revealBtnOff: { backgroundColor: "#F0E8D9" },
  revealBtnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15.5 },
  responseName: { fontFamily: fonts.bodyExtraBold, fontSize: 12.5, color: C.ink, marginBottom: 6 },
  responseReply: { fontFamily: fonts.bodyRegular, fontSize: 13, color: C.ink, marginBottom: 6, lineHeight: 19 },
});
