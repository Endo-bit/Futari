import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Sparkles, ArrowLeftRight, HeartHandshake, Brain, Mail, Grid3x3, ChevronRight } from "lucide-react-native";
import PlayShell, { PlayButton } from "../../components/play/PlayShell";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* The games, all playable before an account exists. Reached from the first
   screen of onboarding and, once signed in, from Home. */

const GAMES = [
  { id: "type", Icon: Sparkles, tint: C.pink, name: "plTypeName", desc: "plTypeDesc" },
  { id: "swipe", Icon: ArrowLeftRight, tint: "#E7EFE2", name: "plSwipeName", desc: "plSwipeDesc" },
  { id: "match", Icon: HeartHandshake, tint: C.pink, name: "plMatchName", desc: "plMatchDesc" },
  { id: "memory", Icon: Brain, tint: "#E4ECF6", name: "plMemoryName", desc: "plMemoryDesc" },
  { id: "capsule", Icon: Mail, tint: "#F6EBD5", name: "plCapsuleName", desc: "plCapsuleDesc" },
  { id: "bingo", Icon: Grid3x3, tint: "#E7EFE2", name: "plBingoName", desc: "plBingoDesc" },
];

export default function PlayHub() {
  const router = useRouter();
  const { t } = useApp();
  const { isSignedIn } = useAuth();

  const open = (id) => {
    track(EV.GAME_OPENED, { game: id, signed_in: !!isSignedIn });
    router.push(`/play/${id}`);
  };

  return (
    <PlayShell
      title={t.plHubTitle}
      sub={t.plHubSub}
      onBack={() => (router.canGoBack() ? router.back() : router.replace(isSignedIn ? "/(tabs)/home" : "/"))}
      footer={!isSignedIn ? <PlayButton label={t.plStartDiary} onPress={() => router.replace("/")} /> : null}
    >
      <View style={{ gap: 12 }}>
        {GAMES.map(({ id, Icon, tint, name, desc }) => (
          <Pressable key={id} onPress={() => open(id)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <View style={[styles.icon, { backgroundColor: tint }]}>
              <Icon size={22} color={C.pinkText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{t[name]}</Text>
              <Text style={styles.desc}>{t[desc]}</Text>
            </View>
            <ChevronRight size={20} color={C.inkSoft} />
          </Pressable>
        ))}
      </View>
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, paddingVertical: 14, paddingHorizontal: 14 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.bodyExtraBold, fontSize: 16.5, color: C.ink },
  desc: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 20, color: C.inkSoft, marginTop: 2 },
});
