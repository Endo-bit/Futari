import { View } from "react-native";
import { C } from "../lib/theme";

/* Approximates the web app's repeating-linear-gradient ruled-paper background with plain lines. */
export default function PaperBg({ children, style, lines = 60 }) {
  return (
    <View style={[{ backgroundColor: C.paper, flex: 1 }, style]}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        {Array.from({ length: lines }).map((_, i) => (
          <View
            key={i}
            style={{ position: "absolute", top: i * 32 + 31, left: 0, right: 0, height: 1, backgroundColor: C.line }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}
