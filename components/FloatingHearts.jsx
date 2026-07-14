import { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import { C } from "../lib/theme";

const COUNT = 12;

export default function FloatingHearts({ active }) {
  const values = useRef(Array.from({ length: COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;
    values.forEach((v) => v.setValue(0));
    const anims = values.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 1600 + (i % 4) * 300,
        delay: i * 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.parallel(anims).start();
  }, [active]); // eslint-disable-line

  if (!active) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {values.map((v, i) => {
        const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -540] });
        const opacity = v.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 0] });
        const color = i % 3 === 0 ? C.pinkDeep : i % 3 === 1 ? C.pinkText : C.green;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              bottom: -30,
              left: `${6 + ((i * 83) % 88)}%`,
              opacity,
              transform: [{ translateY }],
            }}
          >
            <Heart size={14 + (i % 3) * 6} color={color} fill={color} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
});
