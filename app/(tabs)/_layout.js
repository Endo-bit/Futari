import { View, Text, Image, StyleSheet } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { House, PenLine, CalendarDays, Settings } from "lucide-react-native";
import { UserButton } from "@clerk/expo/native";
import { useAuth } from "@clerk/expo";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import ToastView from "../../components/Toast";
import TutorialOverlay from "../../components/TutorialOverlay";
import TrialNotice from "../../components/TrialNotice";

export default function TabsLayout() {
  const { t } = useApp();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }} edges={["top"]}>
      <View style={styles.header}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />
        <Text style={styles.wordmark}>Futari</Text>
        <View style={styles.userButton}>
          <UserButton />
        </View>
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.pinkText,
          tabBarInactiveTintColor: C.inkSoft,
          tabBarStyle: { backgroundColor: "rgba(250,244,231,0.94)", borderTopColor: C.cardBorder },
          tabBarLabelStyle: { fontFamily: fonts.bodyExtraBold, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{ title: t.tabHome, tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="today"
          options={{ title: t.tabToday, tabBarIcon: ({ color, size }) => <PenLine color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="journal"
          options={{ title: t.tabJournal, tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: t.tabSettings, tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
        />
      </Tabs>

      <ToastView />
      <TutorialOverlay />
      <TrialNotice />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  logo: { width: 26, height: 26, borderRadius: 8 },
  wordmark: { fontFamily: fonts.scriptBold, fontSize: 24, lineHeight: 36, paddingVertical: 3, paddingRight: 8, color: C.ink },
  userButton: { marginLeft: "auto" },
});
