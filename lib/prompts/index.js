import * as en from "./en";
import * as es from "./es";
import * as fr from "./fr";
import * as de from "./de";
import * as it from "./it";
import * as ja from "./ja";

/* The day's prompt and couple question, one module per language.

   These used to live inline in i18n.js, which is how they quietly stayed at 15
   solo prompts — a free user met the same question again inside a fortnight.
   Split out, each list is 90 long and easy to keep growing without scrolling
   past two thousand lines of UI strings to find it.

   Shape per language: { pair, solo, quiz } — all arrays of strings. i18n.js
   folds them onto each language as `prompts`, `promptsSolo` and
   `coupleQuestions`, the names the screens already use. */

export const PROMPTS = { en, es, fr, de, it, ja };
