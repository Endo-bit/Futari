import { Share } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

/* Two ways a game result leaves the phone: as a picture of a card (rendered
   locally, never uploaded by us), or as a line of text with a link. Both go
   through the system share sheet, so the user always picks where it goes. */

export async function shareCardImage(ref, { dialogTitle } = {}) {
  const uri = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });
  const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(fileUri, { mimeType: "image/png", UTI: "public.png", dialogTitle });
  return true;
}

/** Resolves true when the sheet reported a share, false when it was dismissed. */
export async function shareText(message) {
  const res = await Share.share({ message });
  return res?.action === Share.sharedAction;
}
