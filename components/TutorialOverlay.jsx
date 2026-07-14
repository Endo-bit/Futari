import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Heart, House, PenLine, CalendarDays, Settings, X } from "lucide-react-native";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

export default function TutorialOverlay() {
  const { tutorialOpen, tutorialStep, setTutorialStep, closeTutorial, t } = useApp();
  if (!tutorialOpen) return null;

  const steps = [
    { Icon: Heart, iconProps: { fill: C.pinkText }, title: t.tutorialWelcomeTitle, body: t.tutorialWelcomeBody },
    { Icon: House, title: t.tutorialHomeTitle, body: t.tutorialHomeBody },
    { Icon: PenLine, title: t.tutorialTodayTitle, body: t.tutorialTodayBody },
    { Icon: CalendarDays, title: t.tutorialJournalTitle, body: t.tutorialJournalBody },
    { Icon: Settings, title: t.tutorialSettingsTitle, body: t.tutorialSettingsBody },
  ];
  const step = steps[tutorialStep];
  const isLast = tutorialStep === steps.length - 1;
  const StepIcon = step.Icon;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeTutorial}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable onPress={closeTutorial} style={styles.closeBtn} accessibilityLabel={t.tutorialSkip}>
            <X size={18} color={C.inkSoft} />
          </Pressable>

          <View style={styles.iconCircle}>
            <StepIcon size={24} color={C.pinkText} {...(step.iconProps || {})} />
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === tutorialStep && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.row}>
            {tutorialStep > 0 && (
              <Pressable style={styles.backBtn} onPress={() => setTutorialStep((s) => s - 1)}>
                <Text style={styles.backLabel}>{t.tutorialBack}</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.nextBtn}
              onPress={() => (isLast ? closeTutorial() : setTutorialStep((s) => s + 1))}
            >
              <Text style={styles.nextLabel}>{isLast ? t.tutorialDone : t.tutorialNext}</Text>
            </Pressable>
          </View>

          {!isLast && (
            <Pressable onPress={closeTutorial}>
              <Text style={styles.skip}>{t.tutorialSkip}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(74,64,54,0.5)", alignItems: "center", justifyContent: "center", padding: 22 },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 26,
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 14,
    ...deepShadow,
  },
  closeBtn: { position: "absolute", top: 14, right: 14, padding: 4 },
  iconCircle: { width: 56, height: 56, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.scriptSemiBold, fontSize: 28, lineHeight: 42, paddingVertical: 3, color: C.ink },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 22, color: C.ink, textAlign: "center" },
  dots: { flexDirection: "row", gap: 6, marginVertical: 2 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: C.cardBorder },
  dotActive: { width: 18, backgroundColor: C.pinkDeep },
  row: { flexDirection: "row", gap: 10, width: "100%" },
  backBtn: { flex: 1, borderRadius: 999, paddingVertical: 13, alignItems: "center", borderWidth: 1.5, borderColor: C.cardBorder, backgroundColor: "#fff" },
  backLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.ink },
  nextBtn: { flex: 1, borderRadius: 999, paddingVertical: 13, alignItems: "center", backgroundColor: C.pinkDeep },
  nextLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: "#fff" },
  skip: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: C.inkSoft },
});
