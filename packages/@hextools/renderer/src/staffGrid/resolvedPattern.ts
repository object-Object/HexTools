import { RGBColor } from "../colors";
import type { HexCoord, HexPattern } from "./hexMath";

export interface ResolvedPattern {
  pattern: HexPattern;
  origin: HexCoord;
  type: ResolvedPatternType;
  /** If provided, overrides the default display in the sidebar. */
  name?: string;
}

export interface ResolvedPatternType {
  color: RGBColor;
  fadeColor: RGBColor;
  success: boolean;
}

export interface NamedResolvedPatternType extends ResolvedPatternType {
  name: string;
}

// https://github.com/FallingColors/HexMod/blob/cdc023a93fa31a3a69a90e1c6538f34c88cdcd98/Common/src/main/java/at/petrak/hexcasting/api/casting/eval/ResolvedPatternType.kt
export const PATTERN_TYPES = {
  Evaluated: {
    name: "Evaluated",
    color: RGBColor.fromRGB(0x7385de),
    fadeColor: RGBColor.fromRGB(0xfecbe6),
    success: true,
  },
  Escaped: {
    name: "Escaped",
    color: RGBColor.fromRGB(0xddcc73),
    fadeColor: RGBColor.fromRGB(0xfffae5),
    success: true,
  },
  Undone: {
    name: "Undone",
    color: RGBColor.fromRGB(0xb26b6b),
    fadeColor: RGBColor.fromRGB(0xcca88e),
    success: true,
  },
  Errored: {
    name: "Errored",
    color: RGBColor.fromRGB(0xde6262),
    fadeColor: RGBColor.fromRGB(0xffc7a0),
    success: false,
  },
  Invalid: {
    name: "Invalid",
    color: RGBColor.fromRGB(0xb26b6b),
    fadeColor: RGBColor.fromRGB(0xcca88e),
    success: false,
  },
  Unresolved: {
    name: "Unresolved",
    color: RGBColor.fromRGB(0x7f7f7f),
    fadeColor: RGBColor.fromRGB(0xcccccc),
    success: false,
  },
} satisfies Record<string, NamedResolvedPatternType>;

export const PATTERN_TYPES_VALUES: NamedResolvedPatternType[] =
  Object.values(PATTERN_TYPES);

export const DEFAULT_PATTERN_TYPE: NamedResolvedPatternType =
  PATTERN_TYPES.Evaluated;
