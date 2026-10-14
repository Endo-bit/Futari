import AsyncStorage from "@react-native-async-storage/async-storage";

/* Small bits of first-run state that have to survive the hop from "no account"
   to "signed in" — the sign-up sheet is native and the app is remounted around
   it, so nothing in React state makes it across. */

const ANSWER_KEY = "futari_onboarding_answer";
const INVITE_SEEN_KEY = "futari_invite_screen_seen";

/** Parks the answer written during onboarding until there is a diary to put it in. */
export async function saveOnboardingAnswer({ dateIso, prompt, answer }) {
  await AsyncStorage.setItem(ANSWER_KEY, JSON.stringify({ dateIso, prompt, answer })).catch(() => {});
}

/**
 * Hands back the parked answer once, and only for the day it was written —
 * someone who signs up tomorrow shouldn't find yesterday's line on today's page.
 */
export async function takeOnboardingAnswer(todayIso) {
  const raw = await AsyncStorage.getItem(ANSWER_KEY).catch(() => null);
  if (!raw) return null;
  await AsyncStorage.removeItem(ANSWER_KEY).catch(() => {});
  try {
    const parsed = JSON.parse(raw);
    return parsed?.dateIso === todayIso && parsed.answer ? parsed : null;
  } catch {
    return null;
  }
}

/* The invite screen is shown once per device after signing in, paired or not
   decided there. It is the one screen whose whole job is pairing. */
export async function inviteScreenSeen() {
  return (await AsyncStorage.getItem(INVITE_SEEN_KEY).catch(() => null)) === "1";
}

export async function markInviteScreenSeen() {
  await AsyncStorage.setItem(INVITE_SEEN_KEY, "1").catch(() => {});
}
