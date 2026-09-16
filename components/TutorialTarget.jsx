import { useCallback, useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTutorial } from "../lib/tutorial";

/* Wrap anything the tour needs to point at.

   Adds no layout of its own — the View is transparent and unstyled unless the
   caller passes one — it only exists so the overlay can ask where the thing is.
   `collapsable={false}` is load-bearing: without it Android flattens the view out
   of the hierarchy and measureInWindow returns zeroes. */
export default function TutorialTarget({ id, style, children }) {
  const { registerTarget, onTargetLayout } = useTutorial();

  // Stable identity matters here: an inline arrow makes React detach and
  // reattach the ref on every render, and a measurement landing in that gap
  // reads an empty registry and silently gives up on the spotlight.
  const setRef = useCallback((node) => registerTarget(id, node), [id, registerTarget]);
  const handleLayout = useCallback(() => onTargetLayout(id), [id, onTargetLayout]);

  useEffect(() => () => registerTarget(id, null), [id]); // eslint-disable-line

  return (
    <View ref={setRef} collapsable={false} onLayout={handleLayout} style={style}>
      {children}
    </View>
  );
}

/**
 * Props to spread onto a screen's ScrollView so the tour can scroll a spotlit
 * control into view.
 *
 * Registration happens on focus rather than on mount: the tab navigator keeps
 * every screen alive, so whichever one mounted last would otherwise stay
 * registered while the user is looking at a different tab.
 */
export function useTutorialScrollProps() {
  const { registerScroll, noteScroll } = useTutorial();
  const ref = useRef(null);

  useFocusEffect(
    useCallback(() => {
      registerScroll(ref.current);
    }, [registerScroll])
  );

  const setRef = useCallback(
    (node) => {
      ref.current = node;
      registerScroll(node);
    },
    [registerScroll]
  );
  const onScroll = useCallback((e) => noteScroll(e.nativeEvent.contentOffset.y), [noteScroll]);

  return useMemo(
    () => ({ ref: setRef, onScroll, scrollEventThrottle: 16 }),
    [setRef, onScroll]
  );
}
