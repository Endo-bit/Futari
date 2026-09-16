import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import {
  Caveat_500Medium,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from "@expo-google-fonts/caveat";
import {
  Nunito_400Regular,
  Nunito_400Regular_Italic,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { EntitlementProvider } from "../lib/entitlement";
import { AppStateProvider } from "../lib/appState";
import { TutorialProvider } from "../lib/tutorial";
import TutorialOverlay from "../components/TutorialOverlay";
import DeepLinkHandler from "../components/DeepLinkHandler";
import { initAnalytics, track } from "../lib/analytics";
import { EV } from "../lib/events";
import { C } from "../lib/theme";

initAnalytics();

SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function RootReady({ children }) {
  const [fontsLoaded] = useFonts({
    Caveat_500Medium,
    Caveat_600SemiBold,
    Caveat_700Bold,
    Nunito_400Regular,
    Nunito_400Regular_Italic,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const { isLoaded: authLoaded } = useAuth();
  const ready = fontsLoaded && authLoaded;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  useEffect(() => {
    track(EV.APP_OPENED);
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  return children;
}

export default function RootLayout() {
  if (!publishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — add it to .env");
  }
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootReady>
        <EntitlementProvider>
          <AppStateProvider>
            <TutorialProvider>
              {/* The tour dims around a hole so the real control stays tappable,
                  which means it has to be positioned against the whole window —
                  hence a plain flex parent here rather than inside the tab layout,
                  whose safe-area inset would shift every measurement down. */}
              <View style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="entry/[date]" options={{ presentation: "modal" }} />
                  <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
                </Stack>
                <TutorialOverlay />
              </View>
              <DeepLinkHandler />
            </TutorialProvider>
          </AppStateProvider>
        </EntitlementProvider>
      </RootReady>
    </ClerkProvider>
  );
}
