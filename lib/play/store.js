import AsyncStorage from "@react-native-async-storage/async-storage";

/* Everything the games remember lives on the device. They are played before
   there is an account (and are meant to be), so nothing here may depend on
   being signed in. Every read tolerates missing or corrupt values. */

const K = {
  type: "futari_play_type",
  swipe: "futari_play_swipe",
  matches: "futari_play_matches",
  capsules: "futari_play_capsules",
  bingo: "futari_play_bingo",
  source: "futari_acq_source",
};

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the game still works for this session.
  }
}

/* ── Love type ───────────────────────────────────────────── */
export const getTypeResult = () => readJson(K.type, null);
export const saveTypeResult = (type) => writeJson(K.type, { type, at: Date.now() });

/* ── This or that: an array of 0/1, one per card ──────────── */
export const getSwipeAnswers = () => readJson(K.swipe, null);
export const saveSwipeAnswers = (answers) => writeJson(K.swipe, { answers, at: Date.now() });

/* ── Links sent to a partner (match check / memory quiz) ──── */
export async function getMatches() {
  const list = await readJson(K.matches, []);
  return Array.isArray(list) ? list : [];
}
export async function addMatch(match) {
  const list = await getMatches();
  const next = [match, ...list.filter((m) => m.code !== match.code)].slice(0, 30);
  await writeJson(K.matches, next);
  return next;
}
export async function updateMatch(code, patch) {
  const list = await getMatches();
  const next = list.map((m) => (m.code === code ? { ...m, ...patch } : m));
  await writeJson(K.matches, next);
  return next;
}

/* ── Time capsules ───────────────────────────────────────── */
export async function getCapsules() {
  const list = await readJson(K.capsules, []);
  return Array.isArray(list) ? list : [];
}
export async function saveCapsules(list) {
  await writeJson(K.capsules, list);
}

/* ── Bingo: marks per month, keyed "YYYY-MM" ─────────────── */
export async function getBingoMarks(monthKey) {
  const all = await readJson(K.bingo, {});
  const marks = all && typeof all === "object" ? all[monthKey] : null;
  return Array.isArray(marks) ? marks : [];
}
export async function setBingoMarks(monthKey, marks) {
  const all = await readJson(K.bingo, {});
  const next = { ...(all && typeof all === "object" ? all : {}), [monthKey]: marks };
  // Keep the last twelve months; older cards are never shown.
  const keys = Object.keys(next).sort().slice(-12);
  await writeJson(K.bingo, Object.fromEntries(keys.map((k) => [k, next[k]])));
}

/* ── Where they heard about us (asked once during onboarding) ── */
export async function getAcquisitionSource() {
  try {
    return await AsyncStorage.getItem(K.source);
  } catch {
    return null;
  }
}
export async function saveAcquisitionSource(source) {
  try {
    await AsyncStorage.setItem(K.source, source);
  } catch {
    // Not worth surfacing.
  }
}
