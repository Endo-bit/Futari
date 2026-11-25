import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Keyboard,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sun, Cloud, Heart, Smile, Clover, Check, Share2, Send, PenLine, MessageCircle } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import KeyboardScrollView from "../../components/KeyboardScrollView";
import ModeToggle from "../../components/ModeToggle";
import SaveButton from "../../components/SaveButton";
import BlockCard from "../../components/BlockCard";
import MoodPicker from "../../components/MoodPicker";
import SdBanner from "../../components/SdBanner";
import PairingPrompt from "../../components/PairingPrompt";
import InlineEditor from "../../components/InlineEditor";
import MindEditor from "../../components/MindEditor";
import ShareSheet from "../../components/ShareSheet";
import FloatingHearts from "../../components/FloatingHearts";
import LockedPage, { WaitingPagesBanner } from "../../components/LockedPage";
import { PairFieldCards } from "../../components/FieldCard";
import TutorialTarget, { useTutorialScrollProps, useTutorialActive } from "../../components/TutorialTarget";
import { C, fonts, cardShadow } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { dateLabel } from "../../lib/format";
import { promptFor } from "../../lib/dailyContent";
import { maybeRequestReviewAfterFirstReveal } from "../../lib/reviewPrompt";
import { signalTutorial } from "../../lib/tutorialBus";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";
import { useDraft, draftComplete, DRAFT_FIELDS } from "../../lib/draft";
import { useCommentNotice, commentSignature } from "../../lib/comments";

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
  const { t, lang, today, todayIso, me, refreshMe, mode, spaceId, api, getEntry, patchEntry, pairToday, refreshPairToday, partnerName, showToast, isDemo, freeRevealsLeft } =
    useApp();
  const router = useRouter();
  const scrollProps = useTutorialScrollProps();
  const touring = useTutorialActive();

  const [editingField, setEditingField] = useState(null);
  const [mindOpen, setMindOpen] = useState(false);
  const [draftReactions, setDraftReactions] = useState([]);
  const [draftReply, setDraftReply] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [hearts, setHearts] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const e = getEntry(todayIso);

  /* Writing happens in a draft on this phone; "Save" sends the whole page at
     once and then the page is finished: read-only here, editable from the
     calendar on Premium. The guided tour's demo pair keeps the old instant
     saves (it is a rehearsal, nothing is sent). */
  const drafting = !isDemo;
  const { draft, setField, clear: clearDraft } = useDraft(spaceId, todayIso);
  const saved = drafting && !!(e.happy || e.mind || e.next || e.promptAnswer);
  const v = drafting && !saved ? { ...e, ...draft } : e;
  const [promptLive, setPromptLive] = useState(null);
  const setValue = (field, value) => {
    if (!drafting) {
      patchToday({ [field]: value });
      return;
    }
    setField(field, value);
    if (value) signalTutorial(`wrote:${field}`);
  };
  const complete = draftComplete({ ...draft, ...(promptLive !== null ? { promptAnswer: promptLive } : {}) });

  /* One paper plane per page: remembered here, and the server refuses a second. */
  const planeKey = `futari_plane_sent_${todayIso}`;
  const [planeSent, setPlaneSent] = useState(false);
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(planeKey).then((x) => setPlaneSent(x === "1")).catch(() => {});
    }, [planeKey])
  );

  /* A partner's comment, announced if it came after the page was opened. */
  const comment = useCommentNotice({ spaceId: me?.pairSpaceId, dateIso: todayIso, pairDay: pairToday });
  const justRevealed = useRef(false);
  useEffect(() => {
    if (justRevealed.current && pairToday?.revealed) {
      justRevealed.current = false;
      const sig = commentSignature(pairToday);
      if (sig) comment.markSeen(sig);
    }
  }, [pairToday]); // eslint-disable-line

  /* Keep the partner's side fresh while this page is open: their writing, the
     reveal, and comments, every 20 seconds while the app is in front. */
  useFocusEffect(
    useCallback(() => {
      if (!me?.pairSpaceId || isDemo) return undefined;
      refreshPairToday().catch(() => {});
      const timer = setInterval(() => refreshPairToday().catch(() => {}), 20000);
      return () => clearInterval(timer);
    }, [me?.pairSpaceId, isDemo]) // eslint-disable-line
  );

  const scrollRef = useRef(null);
  const setScrollRef = useCallback(
    (node) => {
      scrollRef.current = node;
      scrollProps.ref?.(node);
    },
    [scrollProps]
  );

  /* The prompt's answer box is uncontrolled, so it reads `defaultValue` once, when
     it mounts. `promptShown` is what the box is showing; whenever the entry under
     it becomes something the box didn't produce — the demo pair starting or
     ending, a mode switch landing, midnight — the box is remounted. Left alone it
     went on showing the other page's text, and the next blur or save wrote that
     text into this page. */
  const promptDraft = useRef(null);
  const promptShown = useRef(v.promptAnswer || "");
  const [promptBoxKey, setPromptBoxKey] = useState(0);
  useEffect(() => {
    if ((v.promptAnswer || "") === promptShown.current) return;
    promptShown.current = v.promptAnswer || "";
    promptDraft.current = null;
    setPromptLive(null);
    setPromptBoxKey((k) => k + 1);
  }, [v.promptAnswer, todayIso, mode, isDemo]);

  /* The full-screen editors sit above the tour and bring their own keyboard;
     tell it, so it doesn't rearrange this page for a box that isn't on it. */
  const covered = !!editingField || mindOpen || shareOpen;
  useEffect(() => {
    signalTutorial("cover", covered);
  }, [covered]);
  // Once a prompt has been shown/answered for today it is pinned to the entry —
  // recomputing live would let a mode switch silently swap the question out from
  // under an answer the user already wrote. promptFor shows the pinned question
  // in the current language.
  const prompt = promptFor(t, mode, todayIso, e);
  const patchToday = (patch) => patchEntry(todayIso, { ...(e.prompt ? {} : { prompt }), ...patch });
  const wrote = !!(e.happy || e.mind || e.next || e.promptAnswer);
  const revealed = mode === "pair" && !!pairToday?.revealed;
  const alreadySent = !!((pairToday?.myReactions || []).length || pairToday?.myReply);
  const wrotePartner = !!pairToday?.wrotePartner;
  const canReveal = wrote && wrotePartner;
  // Free plan: today's page is closed until the weekly free open is spent on it.
  const locked = !isDemo && !!pairToday?.locked;
  const outOfFreeOpens = locked && (freeRevealsLeft ?? 0) <= 0;

  const doReveal = async () => {
    if (!me?.pairSpaceId) return;
    let res;
    try {
      res = await api.revealDay(me.pairSpaceId, todayIso);
    } catch (err) {
      if (err.message === "PREMIUM_REQUIRED") {
        await Promise.all([refreshPairToday(), refreshMe()]);
        track(EV.PAYWALL_VIEWED, { source: "locked_page", where: "today" });
        router.push("/paywall");
        return;
      }
      throw err;
    }
    if (res?.usedFreeReveal) {
      track(EV.FREE_OPEN_USED, { where: "today" });
      refreshMe();
    }
    justRevealed.current = true;
    await refreshPairToday();
    // Opening the pages is the moment to read from the top.
    scrollRef.current?.scrollTo?.({ y: 0, animated: true });
    setHearts(true);
    showToast(t.revealedToast, "heart");
    setTimeout(() => setHearts(false), 2400);
    // A demo reveal is a tutorial step, not a milestone — asking for a review on
    // the strength of a partner who doesn't exist would be a cheap trick.
    if (!isDemo) {
      track(EV.REVEAL_DONE);
      maybeRequestReviewAfterFirstReveal();
    }
  };

  const handleSave = () => {
    Keyboard.dismiss();
    if (!drafting) {
      const typed = promptDraft.current;
      if (typed !== null && typed !== e.promptAnswer) patchToday({ promptAnswer: typed });
      showToast(t.savedToast);
      signalTutorial("saved");
      return;
    }
    if (saved) return;
    const merged = { ...draft, ...(promptDraft.current !== null ? { promptAnswer: promptDraft.current } : {}) };
    if (!draftComplete(merged)) {
      showToast(t.pgNeedAll, "info");
      // The tour only asks for a couple of parts; let its "press Save" step
      // pass without finishing (and locking) a half-written page.
      if (touring) signalTutorial("saved");
      return;
    }
    const patch = {};
    for (const f of DRAFT_FIELDS) {
      const val = merged[f];
      if (val !== undefined && val !== null && val !== "") patch[f] = typeof val === "string" ? val.trim() : val;
    }
    // savedAt tells the server the page is finished: only now is the partner told.
    patchToday({ ...patch, savedAt: Date.now() });
    clearDraft();
    promptDraft.current = null;
    setPromptLive(null);
    showToast(t.savedToast);
    signalTutorial("saved");
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
      if (!isDemo) track(EV.RESPONSE_SENT, { reactions: draftReactions.length, has_reply: !!draftReply.trim() });
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
      {/* Extra room at the bottom during the tour, so even the last control on
          the page can be scrolled up clear of the bubble and the keyboard. */}
      <KeyboardScrollView {...scrollProps} ref={setScrollRef} contentContainerStyle={{ paddingBottom: touring ? 260 : 40 }}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>{t.todaysPage}</Text>
          <Text style={styles.dateLabel}>{dateLabel(today, t, lang)}</Text>
          {wrote && (
            <Pressable onPress={() => setShareOpen(true)} style={styles.shareBtn} accessibilityLabel={t.shareTitle}>
              <Share2 size={17} color={C.pinkText} />
            </Pressable>
          )}
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
              {!isDemo && <WaitingPagesBanner />}

              {revealed ? (
                <>
                  <View style={styles.promptCard}>
                    <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </View>

                  <Text style={styles.who}>{t.you}</Text>
                  <PairFieldCards entry={e} t={t} />

                  <View style={styles.divider} />
                  <TutorialTarget id="today.partner" style={{ gap: 14 }}>
                    <Text style={styles.who}>{partnerName}</Text>
                    <PairFieldCards entry={pairToday.partner} t={t} />
                  </TutorialTarget>

                  {comment.unseen && (
                    <Pressable onPress={() => comment.markSeen()} style={styles.commentBanner} accessibilityRole="button">
                      <MessageCircle size={20} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commentTitle}>{t.pgCommentArrived}</Text>
                        <Text style={styles.commentAsk}>{t.pgCommentAsk}</Text>
                      </View>
                      <Text style={styles.commentSee}>{t.pgCommentSee}</Text>
                    </Pressable>
                  )}
                  {comment.visible && (
                    <ResponseCard name={partnerName} reply={pairToday.partnerReply} reactions={pairToday.partnerReactions} bg={C.pink} />
                  )}

                  {alreadySent ? (
                    <ResponseCard name={t.you} reply={pairToday.myReply} reactions={pairToday.myReactions} bg={C.greenSoft} />
                  ) : (
                    <TutorialTarget id="today.composer" style={styles.composer}>
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
                    </TutorialTarget>
                  )}
                </>
              ) : (
                <>
                {saved ? (
                <>
                  <View style={styles.promptCard}>
                    <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </View>
                  <PairFieldCards entry={e} t={t} />
                  <Pressable onPress={() => router.push(`/entry/${todayIso}`)} style={styles.editLink} accessibilityRole="button">
                    <PenLine size={15} color={C.inkSoft} />
                    <Text style={styles.editLinkLabel}>{t.pgEditInCalendar}</Text>
                  </Pressable>
                </>
                ) : (
                <>
                  <TutorialTarget id="today.prompt" style={styles.promptCard}>
                    <Text style={styles.promptLabel}>{t.littlePrompt}</Text>
                    <Text style={styles.promptText}>{prompt}</Text>
                    <TextInput
                      key={promptBoxKey}
                      defaultValue={v.promptAnswer}
                      onChangeText={(text) => {
                        promptDraft.current = text;
                        promptShown.current = text;
                        setPromptLive(text);
                      }}
                      onBlur={() => {
                        // From the draft, not the event: Android's blur carries no text.
                        const text = promptDraft.current;
                        if (text !== null && text !== v.promptAnswer) setValue("promptAnswer", text);
                      }}
                      placeholder={t.promptAnswerPh}
                      placeholderTextColor="#B3A794"
                      multiline
                      style={styles.promptInput}
                    />
                  </TutorialTarget>

                  <TutorialTarget id="today.happy">
                    <BlockCard icon={<Sun size={19} color={C.sun} />} title={t.happy} text={v.happy} placeholder={t.happyPh} onPress={() => setEditingField("happy")} />
                  </TutorialTarget>
                  <TutorialTarget id="today.mind">
                    <BlockCard icon={<Cloud size={19} color={C.blue} />} title={t.mind} text={v.mind} placeholder={t.mindPh} onPress={() => setMindOpen(true)} />
                  </TutorialTarget>
                  <BlockCard
                    icon={<Heart size={19} color={C.green} />}
                    title={mode === "personal" ? t.nextSolo : t.next}
                    text={v.next}
                    placeholder={mode === "personal" ? t.nextSoloPh : t.nextPh}
                    onPress={() => setEditingField("next")}
                  />

                  <TutorialTarget id="today.mood">
                    <MoodPicker
                      value={v.mood}
                      label={t.mood}
                      onChange={(id) => {
                        setValue("mood", id);
                        if (id) {
                          showToast(t.moodToast, "heart");
                          signalTutorial("mood");
                          track(EV.MOOD_SET, { mood: id, mode });
                        }
                      }}
                    />
                  </TutorialTarget>
                </>
                )}

                  <TutorialTarget id="today.save">
                    <SaveButton
                      onPress={handleSave}
                      disabled={drafting && (saved || (!complete && !touring))}
                      label={saved ? t.pgSavedDone : t.save}
                      icon={<Check size={18} color={drafting && (saved || (!complete && !touring)) ? C.inkSoft : "#fff"} />}
                    />
                    {drafting && !saved && !complete && <Text style={styles.needAll}>{t.pgNeedAll}</Text>}
                  </TutorialTarget>

                  {saved && !!me?.pairId && !touring && (
                    <Pressable
                      disabled={planeSent}
                      onPress={() => router.push({ pathname: "/plane/send", params: { date: todayIso, spaceId } })}
                      style={[styles.planeBtn, planeSent && styles.planeBtnOff]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: planeSent }}
                    >
                      <Send size={17} color={planeSent ? C.inkSoft : C.pinkText} />
                      <Text style={[styles.planeBtnLabel, planeSent && { color: C.inkSoft }]}>{planeSent ? t.pgPlaneSent : t.plSendPlane}</Text>
                    </Pressable>
                  )}

                  {mode === "pair" && me?.pairSpaceId && (canReveal && outOfFreeOpens ? (
                    <LockedPage where="today" />
                  ) : (
                    <TutorialTarget id="today.reveal" style={{ alignItems: "center", marginTop: 2 }}>
                      <Text style={styles.revealLabel}>{revealLabel}</Text>
                      <Pressable disabled={!canReveal} onPress={doReveal} style={[styles.revealBtn, canReveal ? styles.revealBtnOn : styles.revealBtnOff]}>
                        <Heart size={16} color={canReveal ? C.pinkText : C.inkSoft} />
                        <Text style={[styles.revealBtnLabel, { color: canReveal ? C.pinkText : C.inkSoft }]}>{t.reveal}</Text>
                      </Pressable>
                      {canReveal && locked && <Text style={styles.freeOpenNote}>{t.freeOpenNote}</Text>}
                    </TutorialTarget>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </KeyboardScrollView>

      <FloatingHearts active={hearts} />

      <InlineEditor
        visible={!!editingField}
        field={editingField}
        initialValue={editingField ? v[editingField] : ""}
        onSave={(text) => {
          setValue(editingField, text);
          if (text && !drafting) showToast(t.savedToast);
        }}
        onClose={() => setEditingField(null)}
      />
      <MindEditor
        visible={mindOpen}
        initialValue={v.mind}
        initialTag={v.mindTag}
        onSave={(text, tag) => {
          if (drafting) {
            setValue("mind", text);
            setValue("mindTag", tag);
          } else {
            patchToday({ mind: text, mindTag: tag });
            if (text) showToast(t.savedToast);
          }
        }}
        onClose={() => setMindOpen(false)}
      />
      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        entry={e}
        partner={revealed ? pairToday?.partner : null}
        dateText={dateLabel(today, t, lang)}
        prompt={prompt}
      />
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6, gap: 4 },
  h1: { fontFamily: fonts.scriptSemiBold, fontSize: 34, lineHeight: 50, paddingVertical: 4, paddingRight: 10, color: C.ink, flex: 1 },
  dateLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: C.pinkText },
  shareBtn: { marginLeft: 10, width: 34, height: 34, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.pink },
  section: { paddingHorizontal: 18, paddingTop: 8 },
  // The day's question reads as the heading of the page, not as another card.
  promptCard: { paddingTop: 4, paddingBottom: 2 },
  promptLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 12, letterSpacing: 1.2, color: C.pinkText, marginBottom: 2 },
  promptText: { fontFamily: fonts.scriptSemiBold, fontSize: 27, color: C.ink, lineHeight: 38, paddingVertical: 3, paddingRight: 8 },
  promptInput: { marginTop: 8, minHeight: 64, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 14, padding: 13, fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 22, color: C.ink, textAlignVertical: "top" },
  who: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: C.inkSoft },
  divider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 6 },
  composer: { backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 18, padding: 16 },
  receiveTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.ink, marginBottom: 9 },
  phraseBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  phraseBtnSel: { backgroundColor: C.green },
  phraseLabel: { fontFamily: fonts.bodyRegular, fontSize: 14.5 },
  replyInput: { minHeight: 70, backgroundColor: "#fff", borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 12, fontFamily: fonts.bodyRegular, fontSize: 14.5, color: C.ink, textAlignVertical: "top" },
  reactionRow: { flexDirection: "row", justifyContent: "center", gap: 16, paddingVertical: 16 },
  reactionBtn: { width: 52, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  reactionBtnOn: { borderWidth: 2, borderColor: C.pinkDeep },
  revealLabel: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.inkSoft, marginBottom: 8, textAlign: "center" },
  revealBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 32 },
  revealBtnOn: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.pinkDeep, ...cardShadow },
  revealBtnOff: { backgroundColor: "#F0E8D9" },
  revealBtnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15.5 },
  planeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: C.pinkDeep, backgroundColor: C.card },
  planeBtnOff: { borderColor: C.cardBorder, backgroundColor: "#F1E9DC" },
  needAll: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.inkSoft, textAlign: "center", marginTop: 6 },
  editLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 6 },
  editLinkLabel: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: C.inkSoft },
  commentBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.pinkDeep, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
  commentTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: "#fff" },
  commentAsk: { fontFamily: fonts.bodyRegular, fontSize: 14.5, color: "#fff" },
  commentSee: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: C.pinkDeep, backgroundColor: "#fff", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, overflow: "hidden" },
  planeBtnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15.5, color: C.pinkText },
  freeOpenNote: { fontFamily: fonts.bodyRegular, fontSize: 13, color: C.pinkText, marginTop: 7, textAlign: "center" },
  responseName: { fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: C.ink, marginBottom: 6 },
  responseReply: { fontFamily: fonts.bodyRegular, fontSize: 14, color: C.ink, marginBottom: 6, lineHeight: 19 },
});
