import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";

/* Pairing links.

   Before this, "invite your partner" shared a bare App Store URL and the code
   lived in the picture next to it. The partner had to install, sign up, find the
   fourth tab, and retype six characters — four chances to give up, and pairing is
   the one thing this app is for.

   A link now carries the code. It is an https link rather than futari:// so that
   it survives being pasted anywhere and still does something useful when the app
   isn't installed: /pair/<code> on the web app bounces into the app if it's there
   and offers the App Store if it isn't, remembering the code either way. */

const WEB_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://futari-nine.vercel.app").replace(/\/$/, "");
const PENDING_KEY = "futari_pending_pair_code";

/** Same alphabet createInvite() draws from, so a typo can't masquerade as a code. */
const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

/** The link to put in front of a human. Opens the app when installed. */
export function pairingLink(code) {
  return `${WEB_BASE}/pair/${encodeURIComponent(code)}`;
}

/** The scheme link the web page bounces to. Also what a QR code would encode. */
export function pairingSchemeLink(code) {
  return Linking.createURL("pair", { queryParams: { code } });
}

/**
 * Pulls a pairing code out of any shape of link we might receive:
 *   futari://pair?code=ABC123
 *   futari://pair/ABC123
 *   https://futari-nine.vercel.app/pair/ABC123
 * Returns null for anything else, including a well-formed link with a junk code.
 */
export function parsePairingLink(url) {
  if (!url) return null;
  let parsed;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }
  const segments = [parsed.hostname, ...(parsed.path || "").split("/")].filter(Boolean);
  const pairAt = segments.findIndex((s) => s.toLowerCase() === "pair");
  if (pairAt === -1) return null;

  const raw = parsed.queryParams?.code || segments[pairAt + 1] || null;
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

/* A link can land before there is anyone to pair — the app may not be signed in
   yet, and on a fresh install the sign-up happens after the tap. Park the code
   and let the handler pick it up when an account exists. */
export async function setPendingPairCode(code) {
  await AsyncStorage.setItem(PENDING_KEY, code).catch(() => {});
}

export async function takePendingPairCode() {
  const code = await AsyncStorage.getItem(PENDING_KEY).catch(() => null);
  if (code) await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
  return code;
}

export async function peekPendingPairCode() {
  return AsyncStorage.getItem(PENDING_KEY).catch(() => null);
}
