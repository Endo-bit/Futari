import { useCallback, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Mail, Lock, Plus } from "lucide-react-native";
import PlayShell, { PlayButton, playStyles } from "../../components/play/PlayShell";
import FloatingHearts from "../../components/FloatingHearts";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { getCapsules } from "../../lib/play/store";
import { capsuleReady } from "../../lib/play/logic";
import { sealCapsule, markCapsuleOpened } from "../../lib/play/capsule";
import { LOCALE_TAGS } from "../../lib/i18n";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

const CHOICES = [
  { months: 1, key: "plCap1m" },
  { months: 6, key: "plCap6m" },
  { months: 12, key: "plCap1y" },
];

export default function TimeCapsule() {
  const { t, lang } = useApp();
  const [list, setList] = useState(null);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [months, setMonths] = useState(12);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [hearts, setHearts] = useState(false);

  const load = useCallback(async () => {
    const l = await getCapsules();
    setList(l);
    if (!l.length) setWriting(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(LOCALE_TAGS[lang] || "en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return iso.slice(0, 10);
    }
  };

  const seal = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await sealCapsule({ text, months, t });
      track(EV.GAME_FINISHED, { game: "capsule", months });
      setText("");
      setWriting(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const open = async (c) => {
    if (!capsuleReady(c)) return;
    setOpenId(c.id);
    if (!c.openedAt) {
      setHearts(true);
      setTimeout(() => setHearts(false), 2400);
      setList(await markCapsuleOpened(c.id));
    }
  };

  if (writing) {
    return (
      <PlayShell
        title={t.plCapTitle}
        onBack={list?.length ? () => setWriting(false) : undefined}
        footer={<PlayButton label={t.plCapSeal} onPress={seal} disabled={!text.trim() || busy} icon={<Lock size={17} color={text.trim() ? "#fff" : C.inkSoft} />} />}
      >
        <View style={styles.paper}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t.plCapPh}
            placeholderTextColor="#B3A794"
            multiline
            maxLength={2000}
            style={styles.input}
          />
        </View>
        <Text style={playStyles.kicker}>{t.plCapWhen}</Text>
        <View style={styles.choices}>
          {CHOICES.map((ch) => (
            <Pressable key={ch.months} onPress={() => setMonths(ch.months)} style={[styles.choice, months === ch.months && styles.choiceOn]} accessibilityRole="radio" accessibilityState={{ selected: months === ch.months }}>
              <Text style={[styles.choiceLabel, months === ch.months && { color: "#fff" }]}>{t[ch.key]}</Text>
            </Pressable>
          ))}
        </View>
      </PlayShell>
    );
  }

  return (
    <PlayShell title={t.plCapsuleName} footer={<PlayButton label={t.plCapNew} onPress={() => setWriting(true)} tone="ghost" icon={<Plus size={18} color={C.pinkText} />} />}>
      {(list || []).map((c) => {
        const ready = capsuleReady(c);
        const isOpen = openId === c.id;
        return (
          <Pressable key={c.id} onPress={() => open(c)} style={[styles.envelope, ready && styles.envelopeReady]} accessibilityRole="button" disabled={!ready}>
            <View style={styles.envTop}>
              {ready ? <Mail size={22} color={C.pinkText} /> : <Lock size={20} color={C.inkSoft} />}
              <Text style={[styles.envLabel, ready && { color: C.pinkText }]}>{ready ? (isOpen ? fmt(c.createdAt) : t.plCapReady) : t.plCapSealed.replace("{d}", fmt(c.opensAt))}</Text>
            </View>
            {ready && isOpen ? <Text style={styles.letter}>{c.text}</Text> : ready ? <Text style={styles.tapHint}>{t.plCapOpen}</Text> : null}
          </Pressable>
        );
      })}
      {list && !list.length && <Text style={playStyles.soft}>{t.plCapEmpty}</Text>}
      <FloatingHearts active={hearts} />
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 16 },
  input: { minHeight: 220, fontFamily: fonts.bodyRegular, fontSize: 16.5, lineHeight: 26, color: C.ink, textAlignVertical: "top" },
  choices: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  choice: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder },
  choiceOn: { backgroundColor: C.pinkDeep, borderColor: C.pinkDeep },
  choiceLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: C.ink },
  envelope: { backgroundColor: "#F6EBD5", borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: C.cardBorder },
  envelopeReady: { backgroundColor: C.card, borderColor: C.pinkDeep, borderWidth: 1.5 },
  envTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  envLabel: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15.5, color: C.inkSoft },
  letter: { fontFamily: fonts.bodyRegular, fontSize: 16.5, lineHeight: 26, color: C.ink },
  tapHint: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.pinkText },
});
