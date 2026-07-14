/* Palette, ported 1:1 from the web app's `C` object in components/FutariApp.jsx. */
export const C = {
  paper: "#FAF4E7",
  paperDeep: "#F4ECDC",
  line: "rgba(120,100,70,0.10)",
  ink: "#4A4036",
  inkSoft: "#8C8172",
  card: "#FFFDF8",
  cardBorder: "rgba(120,100,70,0.08)",
  pink: "#F2DBDE",
  pinkDeep: "#E6AEB9",
  pinkText: "#C2708B",
  blue: "#8FB3DC",
  green: "#A9C4A0",
  greenSoft: "#E7EFE2",
  sun: "#E8B65A",
};

/* RN has no CSS box-shadow — this is the web app's `0 2px 10px rgba(120,100,70,0.08)` translated to RN's shadow* + elevation props. */
export const cardShadow = {
  shadowColor: "#785046",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
};

export const deepShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28,
  shadowRadius: 14,
  elevation: 8,
};

/* Each CSS font-weight becomes its own loaded font family in RN — no numeric fontWeight + family combo like on web. */
export const fonts = {
  scriptMedium: "Caveat_500Medium",
  scriptSemiBold: "Caveat_600SemiBold",
  scriptBold: "Caveat_700Bold",
  bodyRegular: "Nunito_400Regular",
  bodyItalic: "Nunito_400Regular_Italic",
  bodySemiBold: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
  bodyExtraBold: "Nunito_800ExtraBold",
};
