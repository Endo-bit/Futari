import { Share, Platform } from "react-native";
import * as StoreReview from "expo-store-review";

const FALLBACK_URL = "https://futari-nine.vercel.app";

/** Prefer the configured App/Play Store listing once app.json sets ios.appStoreUrl /
 * android.playStoreUrl; until then, share the marketing site everyone already links to
 * from the paywall's Terms/Privacy rows. */
function inviteUrl() {
  return StoreReview.storeUrl() || FALLBACK_URL;
}

export async function shareInvite(t) {
  const message = t.inviteFriendMessage.replace("{url}", inviteUrl());
  try {
    await Share.share(
      Platform.OS === "android" ? { message, title: t.inviteFriendShareTitle } : { message },
    );
  } catch {
    // user dismissed the share sheet — nothing to do
  }
}
