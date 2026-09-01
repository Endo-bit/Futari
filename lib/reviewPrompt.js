import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const PROMPTED_KEY = "futari_review_prompted";

/** Ask the OS for a native review prompt, but only the very first time a couple
 * reveals a page together — never again after that. */
export async function maybeRequestReviewAfterFirstReveal() {
  try {
    if (await AsyncStorage.getItem(PROMPTED_KEY)) return;
    await AsyncStorage.setItem(PROMPTED_KEY, "1");
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  } catch {
    // review prompt is best-effort — never block or surface an error for this
  }
}
