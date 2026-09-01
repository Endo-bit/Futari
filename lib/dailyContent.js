import { dayOfYear, fromIso } from "./format";

/* Single source of truth for the two pieces of content the app derives from a
   date rather than storing: the day's little prompt and the couple question.
   Home, Today and the calendar's day page all read them from here so the same
   date can never render two different questions.

   `entry.prompt` / `entry.quizQuestion` are written alongside the answer, so a
   day that was actually written on keeps the exact wording it was written under
   even if the rotation or the prompt list itself changes later. */

export function promptFor(t, mode, dIso, entry) {
  if (entry?.prompt) return entry.prompt;
  const list = mode === "pair" ? t.prompts : t.promptsSolo;
  return list[dayOfYear(fromIso(dIso)) % list.length];
}

export function quizFor(t, dIso, entry) {
  if (entry?.quizQuestion) return entry.quizQuestion;
  return t.coupleQuestions[dayOfYear(fromIso(dIso)) % t.coupleQuestions.length];
}
