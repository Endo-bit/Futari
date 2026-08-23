import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Cloud, Heart, Check } from "lucide-react-native";
import PaperBg from "./PaperBg";
import SaveButton from "./SaveButton";
import { C, fonts, cardShadow, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

/** Full-screen "mind" editor with the tag toggle and the gentle-wording bottom sheet — RN equivalent of the web app's MindEditor overlay. */
export default function MindEditor({ visible, initialValue, initialTag, onSave, onClose }) {
  const { t, lang, api } = useApp();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialValue || "");
  const [tag, setTag] = useState(initialTag || "us");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(initialValue || "");
      setTag(initialTag || "us");
      setSheetOpen(false);
      setSheetDismissed(false);
      setAiSuggestions(null);
    }
  }, [visible, initialValue, initialTag]);

  useEffect(() => {
    if (!visible || sheetDismissed || sheetOpen) return;
    if (t.mindPattern.test(draft)) setSheetOpen(true);
  }, [draft, visible, sheetDismissed, sheetOpen, t]);

  useEffect(() => {
    if (!sheetOpen || !draft.trim()) return;
    let cancelled = false;
    setAiSuggestions(null);
    setAiLoading(true);
    api
      .getGentlerSuggestions(draft.trim(), lang)
      .then((res) => {
        if (!cancelled && Array.isArray(res.suggestions) && res.suggestions.length) setAiSuggestions(res.suggestions);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sheetOpen]); // eslint-disable-line

  const save = () => {
    onSave(draft.trim(), tag);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={save}>
      <PaperBg style={{ position: "relative" }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={save} style={{ padding: 4 }}>
            <ChevronLeft size={22} color={C.inkSoft} />
          </Pressable>
          <Cloud size={20} color={C.blue} />
          <Text style={styles.title}>{t.mind}</Text>
        </View>

        <View style={styles.tagRow}>
          {[["us", t.aboutUs], ["day", t.myDay]].map(([id, label]) => {
            const sel = tag === id;
            return (
              <Pressable key={id} onPress={() => setTag(id)} style={[styles.tagBtn, sel && styles.tagBtnSel]}>
                <Text style={[styles.tagLabel, { color: sel ? C.pinkText : C.inkSoft }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            placeholder={t.mindPh}
            placeholderTextColor="#B3A794"
            multiline
            style={styles.textarea}
          />
          {draft.trim().length > 180 && (
            <View style={styles.nudge}>
              <Heart size={15} color={C.green} />
              <Text style={styles.nudgeText}>{t.talkNudge}</Text>
            </View>
          )}
          {!sheetOpen && draft.trim().length > 0 && (
            <Pressable onPress={() => setSheetOpen(true)} style={styles.gentlerLink}>
              <Heart size={14} color={C.pinkText} />
              <Text style={styles.gentlerLinkText}>{t.gentlerTitle}</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <SaveButton onPress={save} label={t.save} icon={<Check size={18} color="#fff" />} />
        </View>

        {sheetOpen && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon}>
                <Heart size={14} color={C.pinkText} />
              </View>
              <Text style={styles.sheetTitle}>{t.gentlerTitle}</Text>
            </View>
            <Text style={styles.sheetSub}>{t.gentlerSub}</Text>
            {aiLoading && !aiSuggestions && <Text style={styles.sheetLoading}>{t.gentlerLoading}</Text>}
            <View style={{ gap: 9 }}>
              {(aiSuggestions || t.suggestions).map((s, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setDraft(s.replace(/^[«„"「]|[»"」“”]$/g, "").replace(/^["“]|["”]$/g, "").trim());
                    setSheetOpen(false);
                    setSheetDismissed(true);
                  }}
                  style={styles.sheetOption}
                >
                  <Text style={styles.sheetOptionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => {
                setSheetOpen(false);
                setSheetDismissed(true);
              }}
              style={{ alignSelf: "center", marginTop: 14 }}
            >
              <Text style={styles.keepWords}>{t.keepWords}</Text>
            </Pressable>
          </View>
        )}
      </PaperBg>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 27, lineHeight: 40, paddingVertical: 3, paddingRight: 8, color: C.ink },
  tagRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4 },
  tagBtn: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card },
  tagBtnSel: { borderColor: C.pinkDeep, backgroundColor: C.pink },
  tagLabel: { fontFamily: fonts.bodyBold, fontSize: 13 },
  body: { paddingHorizontal: 18, paddingVertical: 10, flexGrow: 1 },
  textarea: {
    minHeight: 170,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    padding: 18,
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    color: C.ink,
    textAlignVertical: "top",
    ...cardShadow,
  },
  nudge: { flexDirection: "row", gap: 8, backgroundColor: C.greenSoft, borderRadius: 14, padding: 12, marginTop: 10 },
  nudgeText: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: 13, color: C.ink, lineHeight: 19 },
  gentlerLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  gentlerLinkText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: C.pinkText },
  footer: { paddingHorizontal: 18, paddingBottom: 26 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: C.pink, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, ...deepShadow },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: "rgba(194,112,139,0.35)", alignSelf: "center", marginBottom: 14 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  sheetIcon: { width: 28, height: 28, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: C.ink },
  sheetSub: { fontFamily: fonts.bodyRegular, fontSize: 13, color: "#A9798C", marginBottom: 12, lineHeight: 19 },
  sheetLoading: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: "#A9798C", marginBottom: 9 },
  sheetOption: { backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  sheetOptionText: { fontFamily: fonts.bodyRegular, fontSize: 14, color: C.ink, lineHeight: 20 },
  keepWords: { fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: C.pinkText },
});
