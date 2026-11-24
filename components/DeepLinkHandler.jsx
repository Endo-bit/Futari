import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useLinkingURL } from "expo-linking";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { useApp } from "../lib/appState";
import { parsePairingLink, setPendingPairCode, takePendingPairCode, peekPendingPairCode } from "../lib/deepLinks";
import { track } from "../lib/analytics";
import { EV } from "../lib/events";

/* expo-notifications throws on web for this one, which blanked the whole web
   build; there are no tapped notifications to read there anyway. */
const useLastNotificationResponse = Platform.OS === "web" ? () => null : Notifications.useLastNotificationResponse;

/* Turns an incoming pairing link into an actual pairing.

   Renders nothing. It lives inside AppStateProvider because redeeming needs the
   api and has to refresh `me` afterwards, and it has to be mounted at the root
   because the link can arrive at any moment — including as the very thing that
   launched the app on a fresh install, long before any tab exists. */
export default function DeepLinkHandler() {
  const url = useLinkingURL();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { api, me, refreshMe, showToast, canPair, t } = useApp();
  // Redeeming twice with the same code fails the second time and shows the user
  // an error for something that actually worked. One attempt per code.
  const attempted = useRef(new Set());
  const busy = useRef(false);

  /* A tapped notification that points somewhere — the "did your partner get the
     invite?" nudge opens the invite screen rather than wherever the app was. */
  const lastResponse = useLastNotificationResponse();
  const handledResponse = useRef(null);
  useEffect(() => {
    const id = lastResponse?.notification?.request?.identifier;
    const data = lastResponse?.notification?.request?.content?.data || {};
    const target = data.url;
    if (!id || handledResponse.current === id || !isLoaded) return;
    // Game notifications work before there is an account; the rest need one.
    if (typeof target === "string" && /^futari:\/\/play(\/(type|swipe|match|memory|capsule|bingo))?$/.test(target)) {
      handledResponse.current = id;
      router.push(target.replace("futari://", "/"));
      return;
    }
    if (data.type === "play_answered") {
      handledResponse.current = id;
      router.push("/play");
      return;
    }
    if (!isSignedIn) return;
    handledResponse.current = id;
    if (target === "futari://invite") router.push("/invite");
    else if (target === "futari://plane") router.push("/plane");
    else if (target === "futari://today") router.push("/(tabs)/today");
  }, [lastResponse, isSignedIn, isLoaded]); // eslint-disable-line

  // A link arrived while the app was running (or launched it).
  useEffect(() => {
    const code = parsePairingLink(url);
    if (!code) return;
    track(EV.INVITE_LINK_OPENED, { signed_in: !!isSignedIn });
    setPendingPairCode(code);
  }, [url, isSignedIn]);

  // Whenever we have both an account and a parked code, spend it.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !me || busy.current) return;

    let cancelled = false;
    (async () => {
      const code = await peekPendingPairCode();
      if (!code || cancelled || attempted.current.has(code)) return;

      if (me.pairId) {
        // Already paired — the link is stale, not broken. Drop it quietly.
        await takePendingPairCode();
        return;
      }
      if (!canPair) {
        // Their trial is spent. Keep the code parked so subscribing finishes the job.
        router.push("/paywall");
        track(EV.PAYWALL_VIEWED, { source: "pair_link" });
        return;
      }

      attempted.current.add(code);
      busy.current = true;
      try {
        await api.redeemInvite(code);
        await takePendingPairCode();
        await refreshMe();
        showToast(t.pairedToast, "heart");
        track(EV.PAIR_REDEEMED, { via: "deep_link" });
      } catch (err) {
        await takePendingPairCode();
        showToast(err.message, "info");
        track(EV.PAIR_FAILED, { via: "deep_link", reason: err?.message || "unknown" });
      } finally {
        busy.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, me, canPair]); // eslint-disable-line

  return null;
}
