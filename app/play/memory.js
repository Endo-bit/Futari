import { useCallback, useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Send, RefreshCw, Check } from "lucide-react-native";
import PlayShell, { PlayButton, playStyles } from "../../components/play/PlayShell";
import FloatingHearts from "../../components/FloatingHearts";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { playContent } from "../../lib/play/content";
import { verdictIndex } from "../../lib/play/logic";
import { getMatches, addMatch, updateMatch } from "../../lib/play/store";
import { createPlayLink, getPlayLink, shareUrl } from "../../lib/play/api";
import { shareText } from "../../lib/play/share";
import { pushTokenIfAllowed } from "../../lib/pushNotifications";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* "How well do you know me?": pick five questions about yourself, give the
   right answer and two decoys, send the link. The partner plays it in a
   browser; the score comes back here. */

const PICK = 5;

export default function MemoryQuiz() {
  const { t, lang, showToast } = useApp();
  const bank = playContent(lang).memoryBank;
  const [step, setStep] = useState("pick");
  const [picked, setPicked] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [link, setLink] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [hearts, setHearts] = useState(false);

  const refresh = useCallback(async () => {
    const list = await getMatches();
    const latest = list.find((m) => m.kind === "memory") || null;
    setLink(latest);
    if (latest && !latest.answered) {
      try {
        const res = await getPlayLink(latest.code);
        if (res.answered) {
          const next = { ...latest, answered: true, score: res.score, total: res.total };
          await updateMatch(latest.code, next);
          setLink(next);
          setHearts(true);
          setTimeout(() => setHearts(false), 2400);
          track(EV.GAME_RESULT_SEEN, { game: "memory", score: res.score });
        }
      } catch {
        // Still waiting, or offline.
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const toggle = (i) => {
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length >= PICK ? p : [...p, i]));
  };

  const setDraft = (i, field, value) => setDrafts((d) => ({ ...d, [i]: { ...(d[i] || {}), [field]: value } }));
  const filled = (i) => {
    const d = drafts[i] || {};
    const vals = [d.right, d.w1, d.w2].map((v) => (v || "").trim());
    return vals.every(Boolean) && new Set(vals.map((v) => v.toLowerCase())).size === 3;
  };
  const ready = picked.length === PICK && picked.every(filled);

  const make = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      const quiz = picked.map((i) => ({ q: bank[i], right: drafts[i].right.trim(), wrong: [drafts[i].w1.trim(), drafts[i].w2.trim()] }));
      const pushToken = await pushTokenIfAllowed().catch(() => null);
      const { code } = await createPlayLink({ kind: "memory", lang, quiz, pushToken });
      const entry = { code, kind: "memory", createdAt: Date.now(), answered: false };
      await addMatch(entry);
      setLink(entry);
      setStep("pick");
      setPicked([]);
      setDrafts({});
      track(EV.GAME_LINK_CREATED, { game: "memory" });
      await shareText(t.plMemShareMsg.replace("{url}", shareUrl(code)));
    } catch {
      showToast(t.plErrNet, "info");
    } finally {
      setBusy(false);
    }
  };

  if (link === undefined) {
    return (
      <PlayShell title={t.plMemoryName}>
        <ActivityIndicator color={C.pinkText} />
      </PlayShell>
    );
  }

  // A sent quiz: show the result, or that we are waiting for it.
  if (link && step !== "write" && step !== "new") {
    const verdicts = t.plMemVerdicts;
    return (
      <PlayShell
        title={t.plMemoryName}
        footer={
          <>
            {!link.answered && <PlayButton label={t.plMatchRefresh} onPress={refresh} icon={<RefreshCw size={18} color="#fff" />} />}
            {!link.answered && (
              <PlayButton label={t.plMatchSend} onPress={() => shareText(t.plMemShareMsg.replace("{url}", shareUrl(link.code))).catch(() => {})} tone="ghost" />
            )}
            <PlayButton label={t.plRetry} onPress={() => setStep("new")} tone={link.answered ? "primary" : "ghost"} />
          </>
        }
      >
        {link.answered ? (
          <View style={{ alignItems: "center", gap: 6, paddingVertical: 14 }}>
            <Text style={styles.score}>{t.plMemScore.replace("{s}", String(link.score)).replace("{t}", String(link.total))}</Text>
            <Text style={styles.verdict}>{verdicts[verdictIndex((link.score / Math.max(1, link.total)) * 100, verdicts.length)]}</Text>
          </View>
        ) : (
          <View style={[playStyles.card, { alignItems: "center", gap: 10, paddingVertical: 26 }]}>
            <ActivityIndicator color={C.pinkText} />
            <Text style={playStyles.soft}>{t.plMatchWaiting}</Text>
          </View>
        )}
        <FloatingHearts active={hearts} />
      </PlayShell>
    );
  }

  if (step === "write") {
    return (
      <PlayShell
        title={t.plMemoryName}
        sub={t.plMemWrite}
        onBack={() => setStep("new")}
        footer={<PlayButton label={t.plMemMake} onPress={make} disabled={!ready || busy} icon={<Send size={18} color={ready ? "#fff" : C.inkSoft} />} />}
      >
        {picked.map((i, n) => (
          <View key={i} style={[playStyles.card, { gap: 8 }]}>
            <Text style={styles.qNum}>{n + 1}</Text>
            <Text style={styles.q}>{bank[i]}</Text>
            <TextInput style={[styles.input, styles.inputRight]} placeholder={t.plMemRight} placeholderTextColor="#B3A794" maxLength={60} value={drafts[i]?.right || ""} onChangeText={(v) => setDraft(i, "right", v)} />
            <TextInput style={styles.input} placeholder={t.plMemWrong1} placeholderTextColor="#B3A794" maxLength={60} value={drafts[i]?.w1 || ""} onChangeText={(v) => setDraft(i, "w1", v)} />
            <TextInput style={styles.input} placeholder={t.plMemWrong2} placeholderTextColor="#B3A794" maxLength={60} value={drafts[i]?.w2 || ""} onChangeText={(v) => setDraft(i, "w2", v)} />
          </View>
        ))}
      </PlayShell>
    );
  }

  return (
    <PlayShell
      title={t.plMemoryName}
      sub={t.plMemPick}
      onBack={link && step === "new" ? () => setStep("pick") : undefined}
      footer={<PlayButton label={t.plNext} onPress={() => setStep("write")} disabled={picked.length !== PICK} />}
    >
      <Text style={playStyles.kicker}>{t.plMemPicked.replace("{s}", String(picked.length)).replace("{t}", String(PICK))}</Text>
      <View style={{ gap: 8 }}>
        {bank.map((q, i) => {
          const on = picked.includes(i);
          return (
            <Pressable key={i} onPress={() => toggle(i)} style={[styles.pick, on && styles.pickOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <Text style={[styles.pickText, on && { color: C.ink }]}>{q}</Text>
              {on && <Check size={18} color={C.pinkText} />}
            </Pressable>
          );
        })}
      </View>
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  score: { fontFamily: fonts.scriptBold, fontSize: 48, lineHeight: 60, paddingHorizontal: 10, color: C.pinkText },
  verdict: { fontFamily: fonts.bodyBold, fontSize: 17, color: C.ink, textAlign: "center" },
  pick: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.cardBorder, paddingVertical: 13, paddingHorizontal: 14 },
  pickOn: { borderColor: C.pinkDeep, backgroundColor: "#FFF6F7" },
  pickText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15.5, lineHeight: 21, color: C.inkSoft },
  qNum: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: C.pinkText },
  q: { fontFamily: fonts.scriptSemiBold, fontSize: 25, lineHeight: 34, paddingRight: 8, color: C.ink },
  input: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.bodyRegular, fontSize: 16, color: C.ink },
  inputRight: { borderColor: C.pinkDeep, borderWidth: 1.5 },
});
