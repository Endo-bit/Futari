import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/* PostHog, spoken over its plain HTTPS ingest API rather than through
   posthog-react-native.

   The SDK would pull in native modules and force a fresh native build before a
   single event could be recorded; the whole point of adding analytics now is to
   find out where people drop off in the build that is already shipping. Funnels,
   retention and cohorts are all computed server-side from these events, so the
   dashboard is identical either way — what we give up is session replay and
   autocapture, neither of which we want on a private diary.

   With no EXPO_PUBLIC_POSTHOG_KEY set, every call here is a no-op: the app must
   behave exactly the same for a contributor who has never heard of PostHog. */

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || "";
const HOST = (process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const enabled = !!KEY;

const DISTINCT_ID_KEY = "futari_ph_distinct_id";
const QUEUE_KEY = "futari_ph_queue";
const FLUSH_AT = 20;
const FLUSH_MS = 10000;
/* A queue that only ever grows is a memory leak with a nice name. Anything past
   this is dropped oldest-first — losing old events beats wedging the app. */
const MAX_QUEUE = 500;

let distinctId = null;
let ready = null;
let queue = [];
let flushTimer = null;
let superProps = {};

function uuid() {
  // Not crypto-grade, and doesn't need to be: this only has to be unique across
  // installs, and it never leaves the device except as an opaque id.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function init() {
  if (!enabled) return;
  const [savedId, savedQueue] = await Promise.all([
    AsyncStorage.getItem(DISTINCT_ID_KEY),
    AsyncStorage.getItem(QUEUE_KEY),
  ]);
  distinctId = savedId || uuid();
  if (!savedId) await AsyncStorage.setItem(DISTINCT_ID_KEY, distinctId).catch(() => {});
  if (savedQueue) {
    try {
      queue = JSON.parse(savedQueue) || [];
    } catch {
      queue = [];
    }
  }
}

/** Call once, as early as possible. Safe to call more than once. */
export function initAnalytics() {
  if (!enabled || ready) return ready;
  ready = init();

  superProps = {
    $app_version: Constants.expoConfig?.version || null,
    $app_build: Constants.expoConfig?.ios?.buildNumber || null,
    platform: Platform.OS,
  };

  // Flush on the way to the background: that's the last moment we're sure to get,
  // and it's exactly when a drop-off happens.
  AppState.addEventListener("change", (state) => {
    if (state !== "active") flush();
  });

  return ready;
}

async function persistQueue() {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_MS);
}

async function enqueue(event, properties) {
  if (!enabled) return;
  await (ready || initAnalytics());
  queue.push({
    event,
    properties: { ...superProps, ...properties, distinct_id: distinctId },
    timestamp: new Date().toISOString(),
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  await persistQueue();
  if (queue.length >= FLUSH_AT) flush();
  else scheduleFlush();
}

export async function flush() {
  if (!enabled || !queue.length) return;
  const batch = queue;
  queue = [];
  await persistQueue();
  try {
    const res = await fetch(`${HOST}/batch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: KEY, batch }),
    });
    // 4xx means PostHog rejected the payload — retrying it forever would wedge the
    // queue behind one bad event, so only a network/5xx failure is worth keeping.
    if (!res.ok && res.status >= 500) throw new Error(`status ${res.status}`);
  } catch {
    queue = [...batch, ...queue].slice(-MAX_QUEUE);
    await persistQueue();
  }
}

/** One event. Never throws, never blocks the caller. */
export function track(event, properties = {}) {
  enqueue(event, properties).catch(() => {});
}

/** Ties every future (and, via $anon_distinct_id, every past) event to a real user. */
export function identify(userId, personProps = {}) {
  if (!enabled || !userId) return;
  (async () => {
    await (ready || initAnalytics());
    if (distinctId === userId) {
      await enqueue("$set", { $set: personProps });
      return;
    }
    const previous = distinctId;
    await enqueue("$identify", { $anon_distinct_id: previous, $set: personProps, distinct_id: userId });
    distinctId = userId;
    await AsyncStorage.setItem(DISTINCT_ID_KEY, distinctId).catch(() => {});
    flush();
  })().catch(() => {});
}

/** Properties stamped onto every subsequent event — entitlement, pairing, language. */
export function setSuperProperties(props) {
  superProps = { ...superProps, ...props };
}

/** Screen views, so PostHog can chart where a session ends. */
export function screen(name, properties = {}) {
  track("$screen", { $screen_name: name, ...properties });
}

/** Signed out: the next person on this device must not inherit the last one's id. */
export function resetAnalytics() {
  if (!enabled) return;
  (async () => {
    await flush();
    distinctId = uuid();
    await AsyncStorage.setItem(DISTINCT_ID_KEY, distinctId).catch(() => {});
  })().catch(() => {});
}

export const analyticsEnabled = enabled;
