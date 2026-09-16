/* One place for every event name we send.

   Analytics rots the moment two screens spell the same moment differently, so
   nothing calls track() with a string literal — it imports from here. The
   grouping mirrors the funnel we actually want to read in PostHog:
   install → sign in → first words → the demo reveal → a real partner → paying. */

export const EV = {
  // ── Onboarding ────────────────────────────────────────────────
  APP_OPENED: "app_opened",
  LANDING_VIEWED: "landing_viewed",
  SIGNIN_STARTED: "signin_started",
  SIGNIN_COMPLETED: "signin_completed",

  // ── Guided tutorial ───────────────────────────────────────────
  TUTORIAL_STARTED: "tutorial_started",
  TUTORIAL_STEP_VIEWED: "tutorial_step_viewed",
  TUTORIAL_STEP_DONE: "tutorial_step_done",
  TUTORIAL_SKIPPED: "tutorial_skipped",
  TUTORIAL_COMPLETED: "tutorial_completed",
  TUTORIAL_REPLAYED: "tutorial_replayed",

  // ── Demo pairing inside the tutorial ──────────────────────────
  DEMO_STARTED: "demo_started",
  DEMO_FIELD_WRITTEN: "demo_field_written",
  DEMO_REVEALED: "demo_revealed",
  DEMO_RESPONSE_SENT: "demo_response_sent",
  DEMO_FINISHED: "demo_finished",

  // ── Notification permission ───────────────────────────────────
  NOTIF_PROMPTED: "notif_prompted",
  NOTIF_GRANTED: "notif_granted",
  NOTIF_DENIED: "notif_denied",
  REMINDER_ENABLED: "reminder_enabled",
  REMINDER_DISABLED: "reminder_disabled",
  REMINDER_TIME_CHANGED: "reminder_time_changed",

  // ── The daily loop ────────────────────────────────────────────
  ENTRY_SAVED: "entry_saved",
  FIRST_ENTRY_WRITTEN: "first_entry_written",
  MOOD_SET: "mood_set",
  REVEAL_DONE: "reveal_done",
  RESPONSE_SENT: "response_sent",
  QUIZ_ANSWERED: "quiz_answered",
  ENTRY_SHARED: "entry_shared",

  // ── Pairing ───────────────────────────────────────────────────
  PAIRING_OPENED: "pairing_opened",
  INVITE_CREATED: "invite_created",
  INVITE_SHARED: "invite_shared",
  INVITE_LINK_OPENED: "invite_link_opened",
  PAIR_REDEEMED: "pair_redeemed",
  PAIR_FAILED: "pair_failed",
  UNPAIRED: "unpaired",

  // ── Money ─────────────────────────────────────────────────────
  PAYWALL_VIEWED: "paywall_viewed",
  PAYWALL_DISMISSED: "paywall_dismissed",
  PLAN_SELECTED: "plan_selected",
  PURCHASE_STARTED: "purchase_started",
  PURCHASE_COMPLETED: "purchase_completed",
  PURCHASE_CANCELLED: "purchase_cancelled",
  PURCHASE_FAILED: "purchase_failed",
  RESTORE_COMPLETED: "restore_completed",
  TRIAL_NOTICE_VIEWED: "trial_notice_viewed",
  TRIAL_NOTICE_CTA: "trial_notice_cta",
  TRIAL_NOTICE_DISMISSED: "trial_notice_dismissed",

  // ── Everything else worth a funnel ────────────────────────────
  SPECIAL_DAY_ADDED: "special_day_added",
  WIDGET_MODE_CHANGED: "widget_mode_changed",
  EXPORT_DONE: "export_done",
  LANG_CHANGED: "lang_changed",
};
