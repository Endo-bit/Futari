import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { AuthProvider, useAuth } from "../lib/auth";
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
import ToastView from "../components/Toast";
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
      {/* Clerk stays mounted only so lib/auth can move a still-live Clerk
          session over to Firebase; everything else reads lib/auth. */}
      <AuthProvider>
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
                  <Stack.Screen name="invite" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="entry/[date]" options={{ presentation: "modal" }} />
                  <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
                  {/* iOS lets you swipe right anywhere on a screen to go back; on screens
                      whose whole point is swiping, that closed the game mid-swipe. */}
                  <Stack.Screen name="play/swipe" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
                  <Stack.Screen name="plane/send" options={{ presentation: "fullScreenModal", gestureEnabled: false, fullScreenGestureEnabled: false }} />
                  <Stack.Screen name="plane/index" options={{ presentation: "fullScreenModal" }} />
                </Stack>
                <TutorialOverlay />
                {/* At the root so screens outside the tabs (games, paper planes) get toasts too. */}
                <ToastView />
              </View>
              <DeepLinkHandler />
            </TutorialProvider>
          </AppStateProvider>
        </EntitlementProvider>
      </RootReady>
      </AuthProvider>
    </ClerkProvider>
  );
}
