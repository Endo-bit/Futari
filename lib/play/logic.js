import { TYPE_KEYS, TYPE_QUIZ_KEYS } from "./content";

/* Pure game rules, kept apart from the screens so they can be tested on their
   own (see lib/play/logic.test.mjs). */

/** answers: index (0..2) picked for each quiz question. Ties go to the type
    listed first in TYPE_KEYS, so the same answers always give the same type. */
export function scoreLoveType(answers) {
  const tally = Object.fromEntries(TYPE_KEYS.map((k) => [k, 0]));
  answers.forEach((pick, qi) => {
    const key = TYPE_QUIZ_KEYS[qi]?.[pick];
    if (key) tally[key] += 1;
  });
  let best = TYPE_KEYS[0];
  for (const k of TYPE_KEYS) if (tally[k] > tally[best]) best = k;
  return best;
}

/** Percentage of cards two people answered the same way (0 when nothing to compare). */
export function matchPercent(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let same = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) same++;
  return Math.round((same / n) * 100);
}

/** Which verdict line (of `count`) a match percentage earns. */
export function verdictIndex(percent, count) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return Math.min(count - 1, Math.floor((p / 100) * count));
}

/* ── Bingo ─────────────────────────────────────────────────── */

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/* A small seeded shuffle so a month's card is the same on every device and
   every launch, but changes from month to month. */
function seeded(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

/** The 9 squares (indices into the bingo pool) for a given "YYYY-MM". */
export function bingoCard(key, poolSize) {
  const [y, m] = key.split("-").map(Number);
  const rand = seeded(y * 100 + m);
  const idx = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, 9);
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/** marks: positions 0..8 that are ticked. Returns the number of full lines. */
export function bingoLines(marks) {
  const set = new Set(marks);
  return LINES.filter((line) => line.every((i) => set.has(i))).length;
}

/* ── Time capsule ──────────────────────────────────────────── */

export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // 31 Jan + 1 month must land on the last day of February, not in March.
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function capsuleReady(capsule, now = new Date()) {
  return !!capsule && new Date(capsule.opensAt).getTime() <= now.getTime();
}

/* ── Memory quiz ───────────────────────────────────────────── */

/** Each question's three options in a fixed but shuffled order, plus where
    the right one ended up. Seeded by the quiz code so creator and player see
    the same order. */
export function memoryOptions(question, seedText, qi) {
  let seed = qi + 1;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = seeded(seed);
  const opts = [question.right, ...(question.wrong || [])].map((text, i) => ({ text, right: i === 0 }));
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}
