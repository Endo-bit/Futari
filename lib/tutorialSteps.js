/* The guided tour, as data.

   The old tutorial was five cards describing the app: "Home is where you see your
   days", tap, tap, done — and then a blank page with no idea what to put on it.
   These steps make the user do each thing once, on the real screen, with the real
   control lit up, and the tour only moves on when it actually happened.

   Fields
     tab     which tab must be on screen for this step (the tour navigates itself)
     target  id of the control to spotlight; null renders a centred card instead
     await   a tutorialBus signal that advances the step — the user did the thing
     cta     "next" (default) | "start" | "demo" | "notif" | "invite" | "none"
     phase   "solo" | "demo" | "keep", used for progress and for drop-off analysis

   Every step is skippable. `await` steps also show a quiet "skip this bit" after a
   few seconds, because a tutorial that can strand someone is worse than no
   tutorial: a step that can't be completed must never become a wall. */

export const STEPS = [
  {
    id: "welcome",
    phase: "solo",
    tab: "today",
    target: null,
    titleKey: "tutWelcomeTitle",
    bodyKey: "tutWelcomeBody",
    cta: "start",
  },
  {
    id: "today.prompt",
    phase: "solo",
    tab: "today",
    target: "today.prompt",
    titleKey: "tutPromptTitle",
    bodyKey: "tutPromptBody",
    await: "wrote:promptAnswer",
  },
  {
    id: "today.happy",
    phase: "solo",
    tab: "today",
    target: "today.happy",
    titleKey: "tutHappyTitle",
    bodyKey: "tutHappyBody",
    await: "wrote:happy",
  },
  {
    id: "today.mind",
    phase: "solo",
    tab: "today",
    target: "today.mind",
    titleKey: "tutMindTitle",
    bodyKey: "tutMindBody",
  },
  {
    id: "today.mood",
    phase: "solo",
    tab: "today",
    target: "today.mood",
    titleKey: "tutMoodTitle",
    bodyKey: "tutMoodBody",
    await: "mood",
  },
  {
    id: "today.save",
    phase: "solo",
    tab: "today",
    target: "today.save",
    titleKey: "tutSaveTitle",
    bodyKey: "tutSaveBody",
    await: "saved",
  },
  {
    id: "journal",
    phase: "solo",
    tab: "journal",
    target: "journal.calendar",
    titleKey: "tutJournalTitle",
    bodyKey: "tutJournalBody",
  },

  /* ── The demo pair ─────────────────────────────────────────────
     Up to here everything has been a diary they keep alone, which is
     the part nobody pays for. This is the part they came for. */
  {
    id: "demo.intro",
    phase: "demo",
    tab: "today",
    target: null,
    titleKey: "tutDemoIntroTitle",
    bodyKey: "tutDemoIntroBody",
    cta: "demo",
  },
  {
    id: "demo.prompt",
    phase: "demo",
    tab: "today",
    target: "today.prompt",
    titleKey: "tutDemoPromptTitle",
    bodyKey: "tutDemoPromptBody",
    await: "demo:wrote:promptAnswer",
  },
  {
    id: "demo.happy",
    phase: "demo",
    tab: "today",
    target: "today.happy",
    titleKey: "tutDemoHappyTitle",
    bodyKey: "tutDemoHappyBody",
    await: "demo:wrote:happy",
  },
  {
    id: "demo.reveal",
    phase: "demo",
    tab: "today",
    target: "today.reveal",
    titleKey: "tutDemoRevealTitle",
    bodyKey: "tutDemoRevealBody",
    await: "demo:revealed",
  },
  {
    id: "demo.partner",
    phase: "demo",
    tab: "today",
    target: "today.partner",
    titleKey: "tutDemoPartnerTitle",
    bodyKey: "tutDemoPartnerBody",
  },
  {
    id: "demo.respond",
    phase: "demo",
    tab: "today",
    target: "today.composer",
    titleKey: "tutDemoRespondTitle",
    bodyKey: "tutDemoRespondBody",
    await: "demo:responded",
  },
  {
    id: "demo.done",
    phase: "demo",
    tab: "today",
    target: null,
    titleKey: "tutDemoDoneTitle",
    bodyKey: "tutDemoDoneBody",
  },

  /* ── Making it stick ───────────────────────────────────────────
     Asked here, with the reveal still fresh, rather than from a switch
     in the fourth tab that almost nobody ever found. */
  {
    id: "notifications",
    phase: "keep",
    tab: "today",
    target: null,
    titleKey: "tutNotifTitle",
    bodyKey: "tutNotifBody",
    cta: "notif",
  },
  {
    id: "invite",
    phase: "keep",
    tab: "today",
    target: null,
    titleKey: "tutInviteTitle",
    bodyKey: "tutInviteBody",
    cta: "invite",
  },
];

export const STEP_COUNT = STEPS.length;

export function stepIndexById(id) {
  return STEPS.findIndex((s) => s.id === id);
}
