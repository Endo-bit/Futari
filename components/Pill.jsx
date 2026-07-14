import { View, StyleSheet } from "react-native";
import { C } from "../lib/theme";

export default function Pill({ on }) {
  return (
    <View style={[styles.track, { backgroundColor: on ? C.green : "#DDD3C4" }]}>
      <View style={[styles.knob, { left: on ? 19 : 3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: 40, height: 23, borderRadius: 999 },
  knob: { position: "absolute", top: 2.5, width: 18, height: 18, borderRadius: 999, backgroundColor: "#fff" },
});
