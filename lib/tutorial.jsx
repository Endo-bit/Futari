import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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

   Nothing here renders. TutorialOverlay reads this and draws. */

const SEEN_KEY = "futari_tutorial_seen";
const DONE_KEY = "futari_tutorial_completed";

/* Where we try to park a spotlit control: below the header, well clear of the
   bubble that will appear under it. */
const DESIRED_Y = 190;
const REMEASURE_MS = 420;

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const router = useRouter();
  const app = useApp();
  const { t, api, demo, showToast, canPair } = app;

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [busy, setBusy] = useState(false);

  const targetRefs = useRef({});
  const scroll = useRef({ ref: null, y: 0 });
  const measureTimers = useRef([]);

  const step = active ? STEPS[index] : null;

  /* ── Target registry ──────────────────────────────────────────── */

  const registerTarget = useCallback((id, ref) => {
    if (ref) targetRefs.current[id] = ref;
    else delete targetRefs.current[id];
  }, []);

  const registerScroll = useCallback((ref) => {
    scroll.current.ref = ref;
  }, []);

  const noteScroll = useCallback((y) => {
    scroll.current.y = y;
  }, []);

  const measure = useCallback((id) => {
    const ref = targetRefs.current[id];
    if (!ref?.measureInWindow) return;
    ref.measureInWindow((x, y, width, height) => {
      if (!width || !height) return;
      setRect({ x, y, width, height });
    });
  }, []);

  /* A spotlight on something below the fold is just a dark screen, so bring the
     control into view first, then measure again once the scroll has settled. */
  const focusTarget = useCallback(
    (id) => {
      const clearAll = () => {
        measureTimers.current.forEach(clearTimeout);
        measureTimers.current = [];
      };
      clearAll();
      const ref = targetRefs.current[id];
      if (!ref?.measureInWindow) {
        // The screen may still be mounting. Try again shortly before giving up.
        measureTimers.current.push(setTimeout(() => measure(id), 250));
        measureTimers.current.push(setTimeout(() => measure(id), 700));
        return;
      }
      ref.measureInWindow((x, y, width, height) => {
        if (!width || !height) return;
        const screenH = Dimensions.get("window").height;
        const needsScroll = y < DESIRED_Y - 40 || y + height > screenH - 260;
        if (needsScroll && scroll.current.ref?.scrollTo) {
          const to = Math.max(0, scroll.current.y + (y - DESIRED_Y));
          scroll.current.ref.scrollTo({ y: to, animated: true });
          measureTimers.current.push(setTimeout(() => measure(id), REMEASURE_MS));
        } else {
          setRect({ x, y, width, height });
        }
      });
    },
    [measure]
  );

  /** Called by useTutorialTarget whenever a registered view lays out. */
  const onTargetLayout = useCallback(
    (id) => {
      if (step?.target === id) measure(id);
    },
    [step?.target, measure]
  );

  /* The overlay asks for this when the keyboard opens or closes: the page slides
     under KeyboardAvoidingView, so the hole we cut is in the wrong place until we
     look again. */
  const refreshRect = useCallback(() => {
    if (step?.target) measure(step.target);
  }, [step?.target, measure]);

  /* ── Running the tour ─────────────────────────────────────────── */

  const finish = useCallback(
    async (reason = "completed") => {
      measureTimers.current.forEach(clearTimeout);
      measureTimers.current = [];
      setActive(false);
      setRect(null);
      demo.stop();
      await AsyncStorage.multiSet([[SEEN_KEY, "1"], [DONE_KEY, reason === "completed" ? "1" : "0"]]).catch(() => {});
      track(reason === "completed" ? EV.TUTORIAL_COMPLETED : EV.TUTORIAL_SKIPPED, {
        step: STEPS[index]?.id,
        step_index: index,
        phase: STEPS[index]?.phase,
      });
    },
    [demo, index]
  );

  const goTo = useCallback(
    (nextIndex) => {
      if (nextIndex >= STEPS.length) {
        finish("completed");
        return;
      }
      setRect(null);
      setIndex(nextIndex);
    },
    [finish]
  );

  const next = useCallback(() => {
    track(EV.TUTORIAL_STEP_DONE, { step: step?.id, step_index: index, phase: step?.phase });
    goTo(index + 1);
  }, [goTo, index, step]);

  const start = useCallback(
    (replay = false) => {
      setIndex(0);
      setRect(null);
      setActive(true);
      track(replay ? EV.TUTORIAL_REPLAYED : EV.TUTORIAL_STARTED);
    },
    []
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

  // Give the destination screen a beat to mount, then light up its control.
  useEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const timer = setTimeout(() => focusTarget(step.target), 220);
    return () => clearTimeout(timer);
  }, [step?.id, step?.target, focusTarget]);

  /* Steps with `await` advance when the user does the thing, not when they tap
     "next" — that's the whole difference between this and a slideshow. */
  useEffect(() => {
    if (!step?.await) return;
    return subscribeTutorial((name) => {
      if (name === step.await) next();
    });
  }, [step?.id, step?.await, next]);

  useEffect(() => () => measureTimers.current.forEach(clearTimeout), []);

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

  const value = useMemo(
    () => ({
      active,
      step,
      index,
      total: STEPS.length,
      rect,
      busy,
      next,
      skip,
      start,
      startDemo,
      enableNotifications,
      startInvite,
      registerTarget,
      registerScroll,
      noteScroll,
      onTargetLayout,
      refreshRect,
    }),
    [
      active, step, index, rect, busy, next, skip, start, startDemo,
      enableNotifications, startInvite, registerTarget, registerScroll, noteScroll, onTargetLayout, refreshRect,
    ]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  // Screens register targets unconditionally, including in tests and previews
  // where no provider is mounted, so this returns an inert stand-in rather than
  // throwing the way useApp does.
  return useContext(TutorialContext) || INERT;
}

const INERT = {
  active: false,
  step: null,
  index: 0,
  total: STEPS.length,
  rect: null,
  busy: false,
  next: () => {},
  skip: () => {},
  start: () => {},
  startDemo: () => {},
  enableNotifications: async () => {},
  startInvite: async () => {},
  registerTarget: () => {},
  registerScroll: () => {},
  noteScroll: () => {},
  onTargetLayout: () => {},
  refreshRect: () => {},
};
