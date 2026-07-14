import { useState } from "react";
import { Pressable, Text, View, Modal, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

function toHHMM(d) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fromHHMM(s) {
  const [h, m] = (s || "21:00").split(":").map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 21, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

/** A single tappable HH:MM field backed by the native time picker — same pattern as DateField. */
export default function TimeField({ value, onChange }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(fromHHMM(value));

  const openPicker = () => {
    setDraft(fromHHMM(value));
    setOpen(true);
  };

  if (Platform.OS === "android") {
    return (
      <>
        <Pressable style={styles.field} onPress={openPicker}>
          <Text style={styles.text}>{value}</Text>
        </Pressable>
        {open && (
          <DateTimePicker
            value={draft}
            mode="time"
            display="default"
            onChange={(event, selected) => {
              setOpen(false);
              if (event.type === "set" && selected) onChange(toHHMM(selected));
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Pressable style={styles.field} onPress={openPicker}>
        <Text style={styles.text}>{value}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <DateTimePicker value={draft} mode="time" display="spinner" onChange={(_, selected) => selected && setDraft(selected)} />
            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                onChange(toHHMM(draft));
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
  field: { backgroundColor: "#fff", borderRadius: 999, borderWidth: 1, borderColor: C.cardBorder, paddingVertical: 8, paddingHorizontal: 16 },
  text: { fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: C.pinkText },
  backdrop: { flex: 1, backgroundColor: "rgba(74,64,54,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, ...cardShadow },
  doneBtn: { backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  doneLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
});
