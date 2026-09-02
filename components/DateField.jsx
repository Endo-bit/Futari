import { useState } from "react";
import { Pressable, Text, View, Modal, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";
import { LOCALE_TAGS } from "../lib/i18n";

function toIso(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** `YYYY-MM-DD` written the way the chosen language writes a date. */
function formatDate(iso, lang, t) {
  const d = new Date(iso + "T00:00:00");
  if (lang === "ja") return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return `${t.monthsShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** A single tappable field that opens the native date picker — the RN equivalent of the web app's year/month/day <select> trio. */
export default function DateField({ value, onChange, placeholder, maximumDate, minimumDate }) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ? new Date(value + "T00:00:00") : new Date());

  /* The picker's month names come from its own locale, which defaults to the
     device's — not to the language chosen in Settings. Pass the app's language
     so a Japanese UI never shows an English month wheel. (iOS only; Android's
     dialog is system-localized and takes no locale.) */
  const locale = LOCALE_TAGS[lang] || lang;

  // The field itself showed the raw ISO string. Render it the way this language
  // writes a date instead.
  const label = value ? formatDate(value, lang, t) : placeholder;

  const openPicker = () => {
    setDraft(value ? new Date(value + "T00:00:00") : new Date());
    setOpen(true);
  };

  if (Platform.OS === "android") {
    return (
      <>
        <Pressable style={styles.field} onPress={openPicker}>
          <Text style={[styles.text, !value && styles.placeholder]}>{label}</Text>
        </Pressable>
        {open && (
          <DateTimePicker
            value={draft}
            mode="date"
            display="default"
            locale={locale}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(event, selected) => {
              setOpen(false);
              if (event.type === "set" && selected) onChange(toIso(selected));
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Pressable style={styles.field} onPress={openPicker}>
        <Text style={[styles.text, !value && styles.placeholder]}>{label}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              locale={locale}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={(_, selected) => selected && setDraft(selected)}
            />
            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                onChange(toIso(draft));
                setOpen(false);
              }}
            >
              <Text style={styles.doneLabel}>{t.done}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  text: { fontFamily: fonts.bodyRegular, fontSize: 14, color: C.ink },
  placeholder: { color: "#B3A794", fontFamily: fonts.bodyItalic },
  backdrop: { flex: 1, backgroundColor: "rgba(74,64,54,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, ...cardShadow },
  doneBtn: { backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  doneLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
});
