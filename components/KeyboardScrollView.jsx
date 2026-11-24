import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Keyboard, Platform, ScrollView, TextInput } from "react-native";

/* A ScrollView that keeps whatever field you're typing in above the keyboard.

   Several screens put a text field in a plain ScrollView (Home's "my goal" and
   "next thing to do", settings, the calendar's special days, the games). When
   the keyboard came up it simply covered the field. KeyboardAvoidingView only
   helped where its offset happened to match the tab bar, so instead this:

   - lets iOS inset the content by however much the keyboard really overlaps
     this view (automaticallyAdjustKeyboardInsets — tab bar included), and
   - once the keyboard is up, measures the focused field on screen and scrolls
     just enough to put it a little above the keyboard. */

const MARGIN = 24;

const KeyboardScrollView = forwardRef(function KeyboardScrollView({ onScroll, children, ...props }, ref) {
  const inner = useRef(null);
  const offset = useRef(0);
  useImperativeHandle(ref, () => inner.current);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const event = Platform.OS === "ios" ? "keyboardDidShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(event, (e) => {
      const input = TextInput.State?.currentlyFocusedInput?.();
      const keyboardTop = e?.endCoordinates?.screenY;
      if (!input || !keyboardTop || !inner.current) return;
      input.measureInWindow?.((x, y, w, h) => {
        const bottom = y + h;
        const overlap = bottom + MARGIN - keyboardTop;
        if (overlap > 0) inner.current?.scrollTo({ y: offset.current + overlap, animated: true });
        else if (y < 80) inner.current?.scrollTo({ y: Math.max(0, offset.current - (80 - y)), animated: true });
      });
    });
    return () => sub.remove();
  }, []);

  return (
    <ScrollView
      ref={inner}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      scrollEventThrottle={16}
      {...props}
      onScroll={(ev) => {
        offset.current = ev.nativeEvent.contentOffset.y;
        onScroll?.(ev);
      }}
    >
      {children}
    </ScrollView>
  );
});

export default KeyboardScrollView;
