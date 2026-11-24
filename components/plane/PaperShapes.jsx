import Svg, { Path, Line, Polygon } from "react-native-svg";
import { C } from "../../lib/theme";

/* The page at each stage of becoming a paper plane, drawn on one 200×260
   canvas so the stages can be cross-faded in place:

   0 the torn-out page (ruled, with a ragged top edge)
   1 top corners folded down to the middle
   2 folded in again, a narrow point
   3 the finished plane, seen from above */

const PAPER = "#FFFDF8";
const EDGE = "rgba(120,100,70,0.35)";
const CREASE = "rgba(120,100,70,0.28)";
const SHADE = "#F1E7D6";

const RAGGED = "M0,10 L12,4 L22,11 L34,3 L46,10 L58,4 L70,12 L82,5 L94,11 L106,3 L118,10 L130,4 L142,12 L154,5 L166,11 L178,3 L190,10 L200,5";

export function PaperStage({ stage, width = 200 }) {
  const height = (width / 200) * 260;
  return (
    <Svg width={width} height={height} viewBox="0 0 200 260">
      {stage === 0 && (
        <>
          <Path d={`${RAGGED} L200,260 L0,260 Z`} fill={PAPER} stroke={EDGE} strokeWidth={1.2} />
          {Array.from({ length: 9 }).map((_, i) => (
            <Line key={i} x1={14} x2={186} y1={40 + i * 24} y2={40 + i * 24} stroke="rgba(120,100,70,0.12)" strokeWidth={1} />
          ))}
        </>
      )}
      {stage === 1 && (
        <>
          <Polygon points="0,100 100,6 200,100 200,260 0,260" fill={PAPER} stroke={EDGE} strokeWidth={1.2} />
          <Polygon points="0,100 100,6 100,100" fill={SHADE} stroke={CREASE} strokeWidth={1} />
          <Polygon points="200,100 100,6 100,100" fill={SHADE} stroke={CREASE} strokeWidth={1} />
          <Line x1={100} y1={6} x2={100} y2={260} stroke={CREASE} strokeWidth={1} strokeDasharray="4,4" />
        </>
      )}
      {stage === 2 && (
        <>
          <Polygon points="30,150 100,6 170,150 170,260 30,260" fill={PAPER} stroke={EDGE} strokeWidth={1.2} />
          <Polygon points="30,150 100,6 100,170" fill={SHADE} stroke={CREASE} strokeWidth={1} />
          <Polygon points="170,150 100,6 100,170" fill={SHADE} stroke={CREASE} strokeWidth={1} />
        </>
      )}
      {stage === 3 && (
        <>
          <Polygon points="100,4 196,226 108,196 100,256 92,196 4,226" fill={PAPER} stroke={EDGE} strokeWidth={1.4} />
          <Polygon points="100,4 108,196 100,256 92,196" fill={SHADE} stroke={CREASE} strokeWidth={1} />
          <Line x1={100} y1={4} x2={100} y2={256} stroke={C.pinkDeep} strokeWidth={1.4} />
        </>
      )}
    </Svg>
  );
}
