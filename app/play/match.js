import { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Send, RefreshCw } from "lucide-react-native";
import PlayShell, { PlayButton, playStyles } from "../../components/play/PlayShell";
import FloatingHearts from "../../components/FloatingHearts";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { playContent } from "../../lib/play/content";
import { verdictIndex } from "../../lib/play/logic";
import { getSwipeAnswers, getMatches, addMatch, updateMatch } from "../../lib/play/store";
import { createPlayLink, getPlayLink, shareUrl } from "../../lib/play/api";
import { shareText } from "../../lib/play/share";
import { pushTokenIfAllowed } from "../../lib/pushNotifications";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* The match check: send the this-or-that cards as a link, the partner answers
   in a browser, and the score comes back here (and as a push, when allowed). */

export default function MatchCheck() {
  const router = useRouter();
  const { t, lang, showToast } = useApp();
  const cards = playContent(lang).thisOrThat;
  const [answers, setAnswers] = useState(undefined);
  const [link, setLink] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hearts, setHearts] = useState(false);

  const refresh = useCallback(async () => {
    const [s, list] = await Promise.all([getSwipeAnswers(), getMatches()]);
    setAnswers(Array.isArray(s?.answers) ? s.answers : null);
    const latest = list.find((m) => m.kind === "thisorthat") || null;
    setLink(latest);
    if (latest && !latest.answered) {
      try {
        const res = await getPlayLink(latest.code);
        if (res.answered) {
          const next = { ...latest, answered: true, percent: res.percent, partnerAnswers: res.partnerAnswers };
          await updateMatch(latest.code, next);
          setLink(next);
          setHearts(true);
          setTimeout(() => setHearts(false), 2400);
          track(EV.GAME_RESULT_SEEN, { game: "match", percent: res.percent });
        }
      } catch {
        // Offline or the server is slow: the waiting state stays, nothing to report.
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const send = async () => {
    if (!answers) return;
    setBusy(true);
    try {
      const pushToken = await pushTokenIfAllowed().catch(() => null);
      const { code } = await createPlayLink({ kind: "thisorthat", lang, answers, pushToken });
      const entry = { code, kind: "thisorthat", createdAt: Date.now(), answered: false, answers };
      await addMatch(entry);
      setLink(entry);
      track(EV.GAME_LINK_CREATED, { game: "match" });
      await shareText(t.plMatchShareMsg.replace("{url}", shareUrl(code)));
    } catch {
      showToast(t.plErrNet, "info");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!link) return;
    await shareText(t.plMatchShareMsg.replace("{url}", shareUrl(link.code))).catch(() => {});
  };

  if (answers === undefined) {
    return (
      <PlayShell title={t.plMatchTitle}>
        <ActivityIndicator color={C.pinkText} />
      </PlayShell>
    );
  }

  if (!answers) {
    return (
      <PlayShell title={t.plMatchTitle} sub={t.plMatchBody} footer={<PlayButton label={t.plSwipeName} onPress={() => router.replace("/play/swipe")} />}>
        <Text style={playStyles.soft}>{t.plSwipeDesc}</Text>
      </PlayShell>
    );
  }

  if (link?.answered) {
    const verdicts = t.plMatchVerdicts;
    const mine = link.answers || answers;
    return (
      <PlayShell
        footer={<PlayButton label={t.plMatchSend} onPress={send} disabled={busy} tone="ghost" icon={<Send size={18} color={C.pinkText} />} />}
      >
        <View style={styles.scoreBox}>
          <Text style={styles.score}>{t.plMatchScore.replace("{p}", String(link.percent))}</Text>
          <Text style={styles.verdict}>{verdicts[verdictIndex(link.percent, verdicts.length)]}</Text>
        </View>
        <View style={{ gap: 8 }}>
          {cards.map((pair, i) => {
            const same = mine[i] === link.partnerAnswers?.[i];
            return (
              <View key={i} style={[styles.row, same && styles.rowSame]}>
                <Text style={styles.rowText} numberOfLines={2}>{pair[mine[i]] ?? ""}</Text>
                <Text style={[styles.badge, same ? styles.badgeSame : styles.badgeDiff]}>{same ? t.plMatchSame : t.plMatchDiff}</Text>
              </View>
            );
          })}
        </View>
        <FloatingHearts active={hearts} />
      </PlayShell>
    );
  }

  return (
    <PlayShell
      title={t.plMatchTitle}
      sub={t.plMatchBody}
      footer={
        link ? (
          <>
            <PlayButton label={t.plMatchRefresh} onPress={refresh} icon={<RefreshCw size={18} color="#fff" />} />
            <PlayButton label={t.plMatchSend} onPress={resend} tone="ghost" />
          </>
        ) : (
          <PlayButton label={t.plMatchSend} onPress={send} disabled={busy} icon={<Send size={18} color="#fff" />} />
        )
      }
    >
      {link && (
        <View style={[playStyles.card, { alignItems: "center", gap: 10, paddingVertical: 26 }]}>
          <ActivityIndicator color={C.pinkText} />
          <Text style={playStyles.soft}>{t.plMatchWaiting}</Text>
        </View>
      )}
      {busy && <ActivityIndicator color={C.pinkText} />}
      <Pressable onPress={() => router.push("/play/swipe")} hitSlop={8} style={{ alignSelf: "center", paddingVertical: 6 }}>
        <Text style={styles.link}>{t.plSwipeName} · {t.plRetry}</Text>
      </Pressable>
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  scoreBox: { alignItems: "center", gap: 4, paddingVertical: 10 },
  score: { fontFamily: fonts.scriptBold, fontSize: 52, lineHeight: 64, paddingHorizontal: 10, color: C.pinkText },
  verdict: { fontFamily: fonts.bodyBold, fontSize: 17, color: C.ink, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, paddingVertical: 11, paddingHorizontal: 14 },
  rowSame: { backgroundColor: "#FFF6F7", borderColor: C.pinkDeep },
  rowText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15.5, color: C.ink },
  badge: { fontFamily: fonts.bodyExtraBold, fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  badgeSame: { backgroundColor: C.pinkDeep, color: "#fff" },
  badgeDiff: { backgroundColor: "#EFE7DA", color: C.inkSoft },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: C.inkSoft },
});
