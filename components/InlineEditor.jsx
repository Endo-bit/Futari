import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Sun, Heart, Check } from "lucide-react-native";
import PaperBg from "./PaperBg";
import SaveButton from "./SaveButton";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

/** Full-screen editor for the "happy" / "next" fields — the RN equivalent of the web app's absolute-positioned InlineEditor overlay. */
export default function InlineEditor({ visible, field, initialValue, onSave, onClose }) {
  const { t, mode } = useApp();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialValue || "");
  useEffect(() => {
    if (visible) setDraft(initialValue || "");
  }, [visible, initialValue]);

  if (!field) return null;
  const isHappy = field === "happy";
  const isSolo = mode === "personal";

  const save = () => {
    onSave(draft.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={save}>
      <PaperBg>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={save} style={{ padding: 4 }}>
            <ChevronLeft size={22} color={C.inkSoft} />
          </Pressable>
          {isHappy ? <Sun size={20} color={C.sun} /> : <Heart size={20} color={C.green} />}
          <Text style={styles.title}>{isHappy ? t.happy : isSolo ? t.nextSolo : t.next}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            placeholder={isHappy ? t.happyPh : isSolo ? t.nextSoloPh : t.nextPh}
            placeholderTextColor="#B3A794"
            multiline
            style={styles.textarea}
          />
          {!isHappy && (
            <View style={styles.chipsWrap}>
              {t.datePlanIdeas.map((idea, i) => (
                <Pressable key={i} onPress={() => setDraft(idea)} style={styles.chip}>
                  <Text style={styles.chipLabel}>{idea}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <SaveButton onPress={save} label={t.save} icon={<Check size={18} color="#fff" />} />
        </View>
      </PaperBg>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 27, lineHeight: 34, color: C.ink },
  body: { paddingHorizontal: 18, paddingVertical: 10, flexGrow: 1 },
  textarea: {
    minHeight: 180,
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
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: C.pinkText },
  footer: { paddingHorizontal: 18, paddingBottom: 26 },
});
