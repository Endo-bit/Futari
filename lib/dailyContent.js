import { dayOfYear, fromIso } from "./format";
import { PROMPTS } from "./prompts";

/* Single source of truth for the two pieces of content the app derives from a
   date rather than storing: the day's little prompt and the couple question.
   Home, Today and the calendar's day page all read them from here so the same
   date can never render two different questions.

   `entry.prompt` / `entry.quizQuestion` are written alongside the answer, so a
   day that was actually written on keeps the question it was written under even
   if the rotation or the prompt list itself changes later.

   What is pinned is the question, not its wording in one language. The stored
   text used to be shown verbatim, so after switching language the prompt — and
   only the prompt — stayed in the old one for the rest of the day. The lists
   are the same questions in the same order in every language, so the stored
   text is looked up and shown as its counterpart in the current one. Wording
   that isn't in any list any more is shown as it was saved. */

const KINDS = { pair: "prompts", solo: "promptsSolo", quiz: "coupleQuestions" };

let where; // text → [{ kind, i }], built on first use
function locate(text) {
  if (!where) {
    where = new Map();
    for (const lists of Object.values(PROMPTS)) {
      for (const kind of Object.keys(KINDS)) {
        (lists[kind] || []).forEach((s, i) => {
          const hits = where.get(s);
          if (hits) hits.push({ kind, i });
          else where.set(s, [{ kind, i }]);
        });
      }
    }
  }
  return where.get(text);
}

/** `stored` in the language of `t`; a few questions sit in two lists, so `prefer` breaks the tie. */
function inLanguage(t, stored, prefer) {
  const hits = locate(stored);
  if (!hits) return stored;
  const hit = hits.find((h) => h.kind === prefer) || hits[0];
  return t[KINDS[hit.kind]]?.[hit.i] || stored;
}

export function promptFor(t, mode, dIso, entry) {
  const kind = mode === "pair" ? "pair" : "solo";
  if (entry?.prompt) return inLanguage(t, entry.prompt, kind);
  const list = t[KINDS[kind]];
  return list[dayOfYear(fromIso(dIso)) % list.length];
}

export function quizFor(t, dIso, entry) {
  if (entry?.quizQuestion) return inLanguage(t, entry.quizQuestion, "quiz");
  return t.coupleQuestions[dayOfYear(fromIso(dIso)) % t.coupleQuestions.length];
}
