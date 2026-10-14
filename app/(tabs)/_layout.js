import { View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { House, PenLine, CalendarDays, Settings } from "lucide-react-native";
import { useAuth } from "@clerk/expo";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import ToastView from "../../components/Toast";
import TrialNotice from "../../components/TrialNotice";

export default function TabsLayout() {
  const { t } = useApp();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }} edges={["top"]}>
      {/* No app-wide header: every tab opens with its own title, and a second
          "Futari" wordmark above it was one heading too many. The account button
          lives in Settings now. */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.pinkText,
          tabBarInactiveTintColor: C.inkSoft,
          tabBarStyle: { backgroundColor: C.paper, borderTopColor: C.line },
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
      <TrialNotice />
    </SafeAreaView>
  );
}
