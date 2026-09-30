import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "./appState";
import { STEPS } from "./tutorialSteps";
import { subscribeTutorial } from "./tutorialBus";
import { enableReminder } from "./reminder";
import { track } from "./analytics";
import { EV } from "./events";

/* The engine behind the guided tour.

   It owns three things the old modal-card tutorial never had: where each control
   physically is on screen (so it can be lit up), which tab we need to be on (so
   the tour can walk there itself), and whether the user has actually done the
   thing yet (so a step can't be nodded past without doing it).

   It also owns the page underneath while the tour runs. The user can't scroll
   it — a drag that starts inside the spotlight used to slide the page out from
   under a hole that stayed put — so every scroll is one the tour asked for, and
   the hole follows it. And it watches the keyboard: while something is being
   typed the instructions get out of the way entirely, and the control being
   typed into is moved to where it can be seen.

   Nothing here renders. TutorialOverlay reads this and draws. */

const SEEN_KEY = "futari_tutorial_seen";
const DONE_KEY = "futari_tutorial_completed";

/* Geometry shared with the overlay, so the space the engine leaves for the
   bubble is the space the overlay then puts it in. */
export const RING = 6; // how far the spotlight reaches past the control
export const GAP = 14; // between the spotlight and the bubble
export const EDGE = 8; // kept clear inside the safe area
export const KEYBOARD_BAR = 56; // the strip holding "Done" that rides on the keyboard
export const BUBBLE_FALLBACK_HEIGHT = 210; // until the bubble has laid out once

const STEP_DELAY_MS = 250; // let the destination screen mount
const SCROLL_SETTLE_MS = 380; // an animated scrollTo, plus a little
const KEYBOARD_SETTLE_MS = 300; // the keyboard, and KeyboardAvoidingView behind it
const RETRY_MS = 300;
const MAX_RETRIES = 4;

/** The band of screen the tour may use: inside the safe area, above the keyboard. */
export function boundsFor(insets, keyboard) {
  const screenH = Dimensions.get("window").height;
  return {
    top: insets.top + EDGE,
    bottom: keyboard > 0 ? screenH - keyboard - KEYBOARD_BAR : screenH - insets.bottom - EDGE,
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Where the top of the spotlit control should sit.

   Moves it as little as possible: if it and its bubble already fit it stays
   where it is. `bubble` is 0 while typing, when there is no bubble to leave
   room for. When the control is simply too tall for the space, one end has to
   give — the start by default, or the end for a control whose business is at
   the bottom (`anchor: "end"`), and always the end while typing, since that is
   where the text box and its send button are. */
function wantedY(rect, bounds, bubble, anchorEnd) {
  const lo = bounds.top + RING;
  const hi = bounds.bottom - RING - rect.height;
  if (bubble === 0) return hi < lo ? hi : clamp(rect.y, lo, hi);
  const room = bubble + GAP;
  if (hi - lo < room) return anchorEnd ? hi : lo;
  return anchorEnd ? clamp(rect.y, lo + room, hi) : clamp(rect.y, lo, hi - room);
}

/* Two contexts, because they change at very different rates. The screens only
   register things and need to know whether a tour is running; the overlay needs
   the spotlight rectangle, which moves on every frame of a scroll. One context
   would re-render the whole Today page each time the hole moved a pixel. */
const TutorialContext = createContext(null);
const TutorialRegistryContext = createContext(null);

export function TutorialProvider({ children }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const { t, api, demo, showToast, canPair } = app;

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [missing, setMissing] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const [busy, setBusy] = useState(false);

  const step = active ? STEPS[index] : null;

  /* Mirrors of the above for the measuring code, which runs from timers and
     native callbacks and must never act on a stale render's values. */
  const stepRef = useRef(null);
  stepRef.current = step;
  const insetsRef = useRef(insets);
  insetsRef.current = insets;
  const rectRef = useRef(null);
  const keyboardRef = useRef(0);

  const targetRefs = useRef({});
  const scroll = useRef(null); // the focused screen's ScrollView, see useTutorialScrollProps
  const base = useRef(null); // { y, scrollY } — where the target was, at which scroll offset
  const bubbleHeight = useRef(0);
  const timer = useRef(null);
  const readyAt = useRef(0); // nothing is measured before this — the step's screen is still arriving
  const placeRef = useRef(() => {});

  const rawKeyboard = useRef(0);
  const covered = useRef(false);
  const coverTimer = useRef(null);

  const modeBefore = useRef(null);
  const setModeRef = useRef(null);

  /* ── Finding and framing the target ───────────────────────────── */

  const schedule = useCallback((delay, attempt = 0, tries = 0) => {
    clearTimeout(timer.current);
    /* Several things ask for a fresh look — a layout, the bubble's height, the
       keyboard — and any of them can fire in the first moments of a step, while
       the tab is still switching and the ScrollView registered is still the
       last screen's. None of them may jump that queue. */
    const wait = Math.max(delay, readyAt.current - Date.now());
    timer.current = setTimeout(() => placeRef.current(attempt, tries), wait);
  }, []);

  const clearSpotlight = useCallback(() => {
    rectRef.current = null;
    base.current = null;
    setRect(null);
  }, []);

  const commit = useCallback((next) => {
    const prev = rectRef.current;
    rectRef.current = next;
    base.current = { y: next.y, scrollY: scroll.current?.y ?? 0 };
    setMissing(false);
    if (
      !prev ||
      Math.abs(prev.x - next.x) > 0.5 ||
      Math.abs(prev.y - next.y) > 0.5 ||
      Math.abs(prev.width - next.width) > 0.5 ||
      Math.abs(prev.height - next.height) > 0.5
    ) {
      setRect(next);
    }
  }, []);

  /* Measure the target, scroll it to where it and the bubble both fit, and only
     then cut the hole. `attempt` counts waits for a target that isn't mounted
     yet; `tries` counts scrolls, so a page that can't scroll any further ends
     with the spotlight where the control really is rather than in a loop. */
  placeRef.current = (attempt, tries) => {
    const s = stepRef.current;
    if (!s?.target) return;
    const again = () => {
      if (attempt < MAX_RETRIES) schedule(RETRY_MS, attempt + 1, tries);
      // The control isn't on this page (a replay on a day that's already been
      // revealed, say). Fall back to a plain card rather than a dark screen.
      else setMissing(true);
    };
    const node = targetRefs.current[s.target];
    if (!node?.measureInWindow) return again();

    node.measureInWindow((x, y, width, height) => {
      if (stepRef.current !== s) return;
      if (!width || !height) return again();
      const here = { x, y, width, height };
      const typing = keyboardRef.current > 0;
      const bounds = boundsFor(insetsRef.current, keyboardRef.current);
      const bubble = typing ? 0 : bubbleHeight.current || BUBBLE_FALLBACK_HEIGHT;
      const want = wantedY(here, bounds, bubble, s.anchor === "end");

      const sc = scroll.current;
      if (sc?.node?.scrollTo && tries < 2) {
        const max = sc.contentH && sc.layoutH ? Math.max(0, sc.contentH - sc.layoutH) : Infinity;
        const to = clamp(sc.y + (y - want), 0, max);
        if (Math.abs(to - sc.y) > 2) {
          sc.node.scrollTo({ y: to, animated: true });
          // Already lit: keep the hole on the control while it travels. Not yet
          // lit: stay dark until it has arrived, so the hole never opens on
          // whatever happened to be there.
          if (rectRef.current) commit(here);
          schedule(SCROLL_SETTLE_MS, attempt, tries + 1);
          return;
        }
      }
      commit(here);
    });
  };

  const registerTarget = useCallback((id, ref) => {
    if (ref) targetRefs.current[id] = ref;
    else delete targetRefs.current[id];
  }, []);

  const registerScroll = useCallback((state) => {
    scroll.current = state;
  }, []);

  /* The page moved. Slide the hole by the same amount straight away — asking
     the view where it is now would answer a frame or two late, and the
     spotlight would visibly trail the thing it's pointing at. */
  const noteScroll = useCallback((state) => {
    if (state !== scroll.current || !base.current || !rectRef.current) return;
    const y = base.current.y - (state.y - base.current.scrollY);
    if (Math.abs(y - rectRef.current.y) < 0.5) return;
    rectRef.current = { ...rectRef.current, y };
    setRect(rectRef.current);
  }, []);

  /** Called by TutorialTarget whenever a registered view lays out. */
  const onTargetLayout = useCallback(
    (id) => {
      // Also how a text box that grows a line keeps its spotlight, and how a
      // control that only appears mid-step (the partner's page) gets found.
      if (stepRef.current?.target === id) schedule(60);
    },
    [schedule]
  );

  /** The overlay reports how tall the bubble really is once it has laid out. */
  const reportBubbleHeight = useCallback(
    (h) => {
      if (Math.abs(h - bubbleHeight.current) < 1) return;
      bubbleHeight.current = h;
      if (stepRef.current?.target) schedule(0);
    },
    [schedule]
  );

  /* ── Keyboard ─────────────────────────────────────────────────── */

  const syncKeyboard = useCallback(() => {
    const h = covered.current ? 0 : rawKeyboard.current;
    if (h === keyboardRef.current) return;
    keyboardRef.current = h;
    setKeyboard(h);
  }, []);

  useEffect(() => {
    // willShow on iOS so the overlay changes with the keyboard rather than after it.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onChange = (h) => {
      rawKeyboard.current = h;
      syncKeyboard();
      // KeyboardAvoidingView resizes the page under us either way, so look
      // again once it has finished.
      if (stepRef.current?.target) schedule(KEYBOARD_SETTLE_MS);
    };
    const shown = Keyboard.addListener(showEvent, (e) => onChange(e.endCoordinates?.height || 0));
    const hidden = Keyboard.addListener(hideEvent, () => onChange(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [schedule, syncKeyboard]);

  /* The full-screen editors are native modals: they sit above the overlay and
     bring their own keyboard. While one is up, that keyboard is none of the
     tour's business — without this the page behind would be shuffled around
     for a text box that isn't on it. */
  useEffect(
    () =>
      subscribeTutorial((name, payload) => {
        if (name !== "cover") return;
        clearTimeout(coverTimer.current);
        if (payload) {
          covered.current = true;
          syncKeyboard();
          return;
        }
        // The editor's keyboard is still on its way down when the editor goes.
        coverTimer.current = setTimeout(() => {
          covered.current = false;
          syncKeyboard();
        }, KEYBOARD_SETTLE_MS + 100);
      }),
    [syncKeyboard]
  );

  /* ── Running the tour ─────────────────────────────────────────── */

  const finish = useCallback(
    async (reason = "completed") => {
      clearTimeout(timer.current);
      Keyboard.dismiss();
      // The tour pads the page so it can scroll controls clear of the bubble;
      // leave the page at the top rather than parked in that padding.
      scroll.current?.node?.scrollTo?.({ y: 0, animated: false });
      setActive(false);
      clearSpotlight();
      demo.stop();
      if (modeBefore.current && modeBefore.current !== "personal") setModeRef.current?.(modeBefore.current);
      modeBefore.current = null;
      await AsyncStorage.multiSet([[SEEN_KEY, "1"], [DONE_KEY, reason === "completed" ? "1" : "0"]]).catch(() => {});
      track(reason === "completed" ? EV.TUTORIAL_COMPLETED : EV.TUTORIAL_SKIPPED, {
        step: STEPS[index]?.id,
        step_index: index,
        phase: STEPS[index]?.phase,
      });
    },
    [demo, index, clearSpotlight]
  );

  const goTo = useCallback(
    (nextIndex) => {
      // A keyboard left up from one step would cover the next one's control.
      Keyboard.dismiss();
      if (nextIndex >= STEPS.length) {
        finish("completed");
        return;
      }
      clearSpotlight();
      setIndex(nextIndex);
    },
    [finish, clearSpotlight]
  );

  const next = useCallback(() => {
    track(EV.TUTORIAL_STEP_DONE, { step: step?.id, step_index: index, phase: step?.phase });
    goTo(index + 1);
  }, [goTo, index, step]);

  const appRef = useRef(app);
  appRef.current = app;

  const start = useCallback(
    (replay = false) => {
      Keyboard.dismiss();
      /* The first half of the tour is the diary you keep alone. Someone replaying
         it while paired would otherwise be walked through their shared page —
         which, once today has been revealed, doesn't have these controls at all. */
      modeBefore.current = appRef.current.mode;
      setModeRef.current = appRef.current.setMode;
      if (appRef.current.mode !== "personal") appRef.current.setMode("personal");
      clearSpotlight();
      setIndex(0);
      setActive(true);
      track(replay ? EV.TUTORIAL_REPLAYED : EV.TUTORIAL_STARTED);
    },
    [clearSpotlight]
  );

  const skip = useCallback(() => finish("skipped"), [finish]);

  /* First run only, and not until there is an account and a `me` to drive —
     the tour navigates between tabs, and firing it at the sign-in screen would
     throw a brand-new visitor into a part of the app they can't be in yet. */
  useEffect(() => {
    if (!app.me?.userId || active) return;
    AsyncStorage.getItem(SEEN_KEY).then((seen) => {
      if (!seen) start(false);
    });
  }, [app.me?.userId]); // eslint-disable-line

  // "How Futari works" in Settings, relayed over the bus.
  useEffect(
    () =>
      subscribeTutorial((name) => {
        if (name === "tutorial:open") start(true);
      }),
    [start]
  );

  /* Each step declares the tab it belongs on, and the tour navigates rather than
     telling the user to. Nothing is more dispiriting than a tutorial that asks
     you to find something. */
  useEffect(() => {
    if (!step) return;
    router.replace(`/(tabs)/${step.tab}`);
    track(EV.TUTORIAL_STEP_VIEWED, { step: step.id, step_index: index, phase: step.phase });
  }, [step?.id]); // eslint-disable-line

  /* A new step starts dark. Give the destination screen a beat to mount, then
     bring its control into view and light it. */
  useEffect(() => {
    clearTimeout(timer.current);
    setMissing(false);
    if (!step?.target) return;
    /* These steps point at the partner's page, which only exists once the day
       is revealed. Someone who tapped past the reveal would be shown a
       spotlight on nothing, so do it for them. */
    if (step.needsReveal && !demo.revealed) demo.reveal();
    readyAt.current = Date.now() + STEP_DELAY_MS;
    schedule(STEP_DELAY_MS);
  }, [step?.id]); // eslint-disable-line

  /* Steps with `await` advance when the user does the thing, not when they tap
     "next" — that's the whole difference between this and a slideshow. */
  useEffect(() => {
    if (!step?.await) return;
    return subscribeTutorial((name) => {
      if (name === step.await) next();
    });
  }, [step?.id, step?.await, next]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(coverTimer.current);
    },
    []
  );

  /* ── Step actions ─────────────────────────────────────────────── */

  const startDemo = useCallback(() => {
    demo.start();
    next();
  }, [demo, next]);

  const enableNotifications = useCallback(async () => {
    setBusy(true);
    try {
      const ok = await enableReminder({ api, t, source: "tutorial" });
      if (!ok) showToast(t.pushDenied, "info");
    } finally {
      setBusy(false);
      next();
    }
  }, [api, t, showToast, next]);

  /* Last step: hand them a real invite. The demo has just shown them what pairing
     is for, which is the only moment this ask has ever made sense. */
  const startInvite = useCallback(async () => {
    setBusy(true);
    try {
      demo.stop();
      if (!canPair) {
        await finish("completed");
        router.push("/paywall");
        track(EV.PAYWALL_VIEWED, { source: "tutorial_invite" });
        return;
      }
      await finish("completed");
      router.push("/(tabs)/settings?invite=1");
      track(EV.PAIRING_OPENED, { source: "tutorial" });
    } finally {
      setBusy(false);
    }
  }, [demo, canPair, finish, router]);

  const bounds = useMemo(() => boundsFor(insets, keyboard), [insets, keyboard]);

  const value = useMemo(
    () => ({
      active,
      step,
      index,
      total: STEPS.length,
      rect,
      missing,
      keyboard,
      bounds,
      busy,
      next,
      skip,
      start,
      startDemo,
      enableNotifications,
      startInvite,
      reportBubbleHeight,
    }),
    [
      active, step, index, rect, missing, keyboard, bounds, busy, next, skip, start, startDemo,
      enableNotifications, startInvite, reportBubbleHeight,
    ]
  );

  const registry = useMemo(
    () => ({ active, registerTarget, registerScroll, noteScroll, onTargetLayout }),
    [active, registerTarget, registerScroll, noteScroll, onTargetLayout]
  );

  return (
    <TutorialRegistryContext.Provider value={registry}>
      <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
    </TutorialRegistryContext.Provider>
  );
}

export function useTutorial() {
  // The overlay is mounted unconditionally, including in tests and previews
  // where no provider is, so this returns an inert stand-in rather than
  // throwing the way useApp does.
  return useContext(TutorialContext) || INERT;
}

/** What the screens use: registration, and whether a tour is running. */
export function useTutorialRegistry() {
  return useContext(TutorialRegistryContext) || INERT_REGISTRY;
}

const INERT = {
  active: false,
  step: null,
  index: 0,
  total: STEPS.length,
  rect: null,
  missing: false,
  keyboard: 0,
  bounds: { top: 0, bottom: 0 },
  busy: false,
  next: () => {},
  skip: () => {},
  start: () => {},
  startDemo: () => {},
  enableNotifications: async () => {},
  startInvite: async () => {},
  reportBubbleHeight: () => {},
};

const INERT_REGISTRY = {
  active: false,
  registerTarget: () => {},
  registerScroll: () => {},
  noteScroll: () => {},
  onTargetLayout: () => {},
};
