import { useCallback, useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTutorialRegistry } from "../lib/tutorial";

/* Wrap anything the tour needs to point at.

   Adds no layout of its own — the View is transparent and unstyled unless the
   caller passes one — it only exists so the overlay can ask where the thing is.
   `collapsable={false}` is load-bearing: without it Android flattens the view out
   of the hierarchy and measureInWindow returns zeroes. */
export default function TutorialTarget({ id, style, children }) {
  const { registerTarget, onTargetLayout } = useTutorialRegistry();

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

/** Whether a tour is running — for the few things a screen does differently during one. */
export function useTutorialActive() {
  return useTutorialRegistry().active;
}

/**
 * Props to spread onto a screen's ScrollView so the tour can scroll a spotlit
 * control into view — and so nobody else can while it's running: the spotlight
 * is cut where the control was measured, and a page dragged by hand slides out
 * from under it.
 *
 * Each screen keeps its own offset and size here. They used to share one
 * number, so the Journal step worked out its scroll from wherever Today had
 * been left.
 *
 * Registration happens on focus rather than on mount: the tab navigator keeps
 * every screen alive, so whichever one mounted last would otherwise stay
 * registered while the user is looking at a different tab.
 */
export function useTutorialScrollProps() {
  const { active, registerScroll, noteScroll } = useTutorialRegistry();
  const state = useRef({ node: null, y: 0, contentH: 0, layoutH: 0 }).current;

  useFocusEffect(
    useCallback(() => {
      registerScroll(state);
    }, [registerScroll, state])
  );

  const setRef = useCallback(
    (node) => {
      state.node = node;
    },
    [state]
  );
  const onScroll = useCallback(
    (e) => {
      state.y = e.nativeEvent.contentOffset.y;
      noteScroll(state);
    },
    [noteScroll, state]
  );
  const onLayout = useCallback(
    (e) => {
      state.layoutH = e.nativeEvent.layout.height;
    },
    [state]
  );
  const onContentSizeChange = useCallback(
    (_w, h) => {
      state.contentH = h;
    },
    [state]
  );

  return useMemo(
    () => ({ ref: setRef, onScroll, onLayout, onContentSizeChange, scrollEventThrottle: 16, scrollEnabled: !active }),
    [setRef, onScroll, onLayout, onContentSizeChange, active]
  );
}
