import { useCallback, useMemo, useRef, useState } from "react";
import { signalTutorial } from "./tutorialBus";
import { track } from "./analytics";
import { EV } from "./events";

/* A partner who isn't real, so that the thing this app is for can be felt before
   anyone has to talk someone else into installing it.

   Everything free about Futari is a diary you keep alone — which is the same
   diary every phone already ships with. The one feature worth paying for is the
   one a new user can't reach: writing separately and opening the two pages at the
   same moment. The demo hands them that moment on their first run.

   It is entirely local. No demo user in Firestore, no pair document, no API call,
   nothing to clean up if the app is killed halfway through, and nothing that can
   leak into the numbers we're about to start collecting. The screens don't know
   it exists: AppStateProvider swaps these values in while it's running, so
   today.js renders a real pair page against a partner made of six strings. */

export const DEMO_PAIR_ID = "__demo__";
export const DEMO_SPACE_ID = "__demo_space__";

const EMPTY = {
  happy: "",
  mind: "",
  mindTag: "us",
  next: "",
  mood: null,
  promptAnswer: "",
  quizChoice: null,
  prompt: "",
  quizQuestion: "",
};

/** How long the demo partner "takes" to react after you send yours. */
const PARTNER_REPLY_DELAY = 1400;

export function useDemoPair({ t, todayIso }) {
  const [active, setActive] = useState(false);
  const [entry, setEntry] = useState(EMPTY);
  const [revealed, setRevealed] = useState(false);
  const [myReactions, setMyReactions] = useState([]);
  const [myReply, setMyReply] = useState(null);
  const [partnerResponded, setPartnerResponded] = useState(false);
  const replyTimer = useRef(null);

  const partnerName = t.demoPartnerName;

  // The page the demo partner "already wrote" — waiting, so the very first thing
  // a new user does can be the reveal rather than a day of waiting for someone.
  const partnerEntry = useMemo(
    () => ({
      happy: t.demoPartnerHappy,
      mind: t.demoPartnerMind,
      mindTag: "us",
      next: t.demoPartnerNext,
      mood: "love",
      promptAnswer: t.demoPartnerPromptAnswer,
      quizChoice: "partner",
      prompt: "",
      quizQuestion: "",
    }),
    [t]
  );

  const start = useCallback(() => {
    setEntry(EMPTY);
    setRevealed(false);
    setMyReactions([]);
    setMyReply(null);
    setPartnerResponded(false);
    setActive(true);
    track(EV.DEMO_STARTED);
  }, []);

  const stop = useCallback(() => {
    clearTimeout(replyTimer.current);
    setActive(false);
    setEntry(EMPTY);
    setRevealed(false);
    setMyReactions([]);
    setMyReply(null);
    setPartnerResponded(false);
  }, []);

  const wroteMine = !!(entry.happy || entry.mind || entry.next || entry.promptAnswer);

  const pairToday = useMemo(
    () => ({
      mine: entry,
      partner: revealed ? partnerEntry : null,
      wroteMine,
      wrotePartner: true,
      revealed,
      myReactions,
      myReply,
      partnerReactions: partnerResponded ? ["heart", "smile"] : [],
      partnerReply: partnerResponded ? t.demoPartnerReply : null,
    }),
    [entry, revealed, partnerEntry, wroteMine, myReactions, myReply, partnerResponded, t]
  );

  const patchEntry = useCallback((dIso, patch) => {
    setEntry((e) => ({ ...e, ...patch }));
    for (const field of Object.keys(patch)) {
      if (patch[field]) {
        signalTutorial(`demo:wrote:${field}`);
        track(EV.DEMO_FIELD_WRITTEN, { field });
      }
    }
    signalTutorial("demo:wrote");
  }, []);

  /* The demo has to answer the same calls the real screens make, or every screen
     would need an `if (demo)` branch. Anything not listed falls through to the
     real api, which is fine — none of it touches the pair space. */
  const makeApi = useCallback(
    (realApi) => ({
      ...realApi,
      saveEntry: async (_spaceId, dIso, patch) => {
        patchEntry(dIso, patch);
        return { ok: true };
      },
      getPairDay: async () => pairToday,
      revealDay: async () => {
        setRevealed(true);
        signalTutorial("demo:revealed");
        track(EV.DEMO_REVEALED);
        return { ok: true };
      },
      submitResponse: async (_spaceId, _dIso, { reactions, reply }) => {
        setMyReactions(reactions || []);
        setMyReply(reply || null);
        signalTutorial("demo:responded");
        track(EV.DEMO_RESPONSE_SENT, { reactions: (reactions || []).length, has_reply: !!reply });
        clearTimeout(replyTimer.current);
        replyTimer.current = setTimeout(() => setPartnerResponded(true), PARTNER_REPLY_DELAY);
        return { ok: true };
      },
      // Pairing-shaped writes are meaningless against a partner who isn't there.
      saveStartDate: async () => ({ ok: true }),
      saveSharedGoal: async () => ({ ok: true }),
      saveNextPlan: async () => ({ ok: true }),
    }),
    [patchEntry, pairToday]
  );

  /** What AppStateProvider lays over its own value while the demo is running. */
  const buildOverrides = useCallback(
    (base) => ({
      api: makeApi(base.api),
      me: {
        ...(base.me || {}),
        pairId: DEMO_PAIR_ID,
        pairSpaceId: DEMO_SPACE_ID,
        partner: { firstName: partnerName, imageUrl: null },
        sharedGoal: t.demoSharedGoal,
        nextPlan: t.demoNextPlan,
        startDate: base.me?.startDate || null,
      },
      mode: "pair",
      // Leaving pair mode mid-demo would drop them onto a blank personal page with
      // no way back, so the toggle is inert until the demo ends.
      setMode: () => {},
      spaceId: DEMO_SPACE_ID,
      partnerName,
      entries: { [todayIso]: entry },
      getEntry: (dIso) => (dIso === todayIso ? entry : EMPTY),
      patchEntry,
      pairToday,
      setPairToday: () => {},
      refreshPairToday: async () => {},
      isDemo: true,
    }),
    [makeApi, partnerName, t, todayIso, entry, patchEntry, pairToday]
  );

  return { active, start, stop, buildOverrides, revealed, wroteMine };
}
