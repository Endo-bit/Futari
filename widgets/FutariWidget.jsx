import { Text, VStack, HStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundColor,
  lineLimit,
  minimumScaleFactor,
  multilineTextAlignment,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";

/* The Home Screen / Lock Screen widget.

   The body below is extracted at build time and stringified into the widget
   extension, so it cannot close over anything outside itself — no imported
   palette, no i18n, no date maths. Everything it draws arrives pre-formatted in
   `props`, written by lib/widgets.js whenever the app has fresh data. That also
   keeps the widget correct in whichever language the app is set to.

   props:
     label  small heading, e.g. "WHAT WE'LL DO NEXT"
     title  the main line (a prompt, a question, the partner's plan)
     body   an optional second line
     value  a big number for the countdown modes ("312")
     unit   what the number counts ("days")  */
function FutariWidget(props, environment) {
  "widget";

  const ink = "#4A4036";
  const inkSoft = "#8C8172";
  const pinkText = "#C2708B";
  const paper = "#FAF4E7";

  const family = environment.widgetFamily;
  const label = props.label || "Futari";
  const title = props.title || "";
  const body = props.body || "";
  const value = props.value || "";
  const unit = props.unit || "";

  // The Lock Screen renders everything in a single vibrant tint, so these families
  // get their own tighter layouts and no colour of their own.
  if (family === "accessoryInline") {
    return <Text>{value ? `${label} ${value} ${unit}` : `${label} ${title}`}</Text>;
  }

  if (family === "accessoryCircular") {
    return (
      <VStack spacing={0} modifiers={[widgetURL("futari://")]}>
        <Text modifiers={[font({ size: 20, weight: "bold", design: "rounded" }), minimumScaleFactor(0.5), lineLimit(1)]}>
          {value || "♡"}
        </Text>
        <Text modifiers={[font({ size: 9, weight: "semibold" }), lineLimit(1), minimumScaleFactor(0.6)]}>
          {value ? unit : label}
        </Text>
      </VStack>
    );
  }

  if (family === "accessoryRectangular") {
    return (
      <VStack alignment="leading" spacing={2} modifiers={[widgetURL("futari://")]}>
        <Text modifiers={[font({ size: 10, weight: "bold" }), lineLimit(1)]}>{label}</Text>
        {value ? (
          <HStack spacing={4}>
            <Text modifiers={[font({ size: 22, weight: "bold", design: "rounded" })]}>{value}</Text>
            <Text modifiers={[font({ size: 11, weight: "semibold" })]}>{unit}</Text>
          </HStack>
        ) : (
          <Text modifiers={[font({ size: 12 }), lineLimit(2), minimumScaleFactor(0.7)]}>{title}</Text>
        )}
      </VStack>
    );
  }

  const isSmall = family === "systemSmall";

  return (
    <VStack
      alignment="leading"
      spacing={isSmall ? 5 : 7}
      modifiers={[containerBackground(paper, "widget"), widgetURL("futari://")]}
    >
      <Text
        modifiers={[
          font({ size: isSmall ? 9.5 : 10.5, weight: "heavy" }),
          foregroundColor(pinkText),
          lineLimit(1),
        ]}
      >
        {label}
      </Text>

      {value ? (
        <VStack alignment="leading" spacing={0}>
          <Text modifiers={[font({ size: isSmall ? 40 : 46, weight: "bold", design: "rounded" }), foregroundColor(ink), minimumScaleFactor(0.5), lineLimit(1)]}>
            {value}
          </Text>
          <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundColor(inkSoft), lineLimit(1)]}>
            {unit}
          </Text>
        </VStack>
      ) : (
        <Text
          modifiers={[
            font({ size: isSmall ? 14 : 16, weight: "semibold" }),
            foregroundColor(ink),
            multilineTextAlignment("leading"),
            lineLimit(isSmall ? 4 : 3),
            minimumScaleFactor(0.7),
          ]}
        >
          {title}
        </Text>
      )}

      {!!body && (
        <Text
          modifiers={[
            font({ size: isSmall ? 11 : 12.5 }),
            foregroundColor(inkSoft),
            multilineTextAlignment("leading"),
            lineLimit(isSmall ? 2 : 3),
            minimumScaleFactor(0.7),
          ]}
        >
          {body}
        </Text>
      )}
    </VStack>
  );
}

export default createWidget("FutariWidget", FutariWidget);
