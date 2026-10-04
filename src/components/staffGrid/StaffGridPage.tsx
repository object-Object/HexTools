import { useHotkeys, useStateHistory } from "@mantine/hooks";
import _ from "lodash";
import { useRef, useState } from "react";

import { StaffGrid, type StaffGridRef, useDeviceMotion } from "@hextools/react";
import { useIsTouchscreen } from "@hextools/react";
import { useLocalStorageObject } from "@hextools/react";
import {
  DEFAULT_PATTERN_TYPE,
  GuiSpellcasting,
  HexCoord,
  PATTERN_TYPES,
  type ResolvedPattern,
} from "@hextools/renderer/staffGrid";

import type { HexToolsGridSettings } from "./StaffGrid.lib";
import StaffGridControls from "./StaffGridControls";
import StaffGridTimer from "./StaffGridTimer";

export default function StaffGridPage() {
  const isTouchscreen = useIsTouchscreen();

  const [patterns, patternsHandlers, patternsHistory] = useStateHistory<
    readonly ResolvedPattern[]
  >([]);

  // HACK
  const latestPatternsRef = useRef(patterns);
  // eslint-disable-next-line react-hooks/refs
  latestPatternsRef.current = patterns;

  const [patternType, setPatternType] = useState(DEFAULT_PATTERN_TYPE);

  const [drawTimeMs, setDrawTimeMs] = useState<number | null>(null);
  const [prevDrawTimeMs, setPrevDrawTimeMs] = useState<number | null>(null);

  const staffGridRef = useRef<StaffGridRef>(null);

  const defaultSettings: HexToolsGridSettings = {
    ...GuiSpellcasting.getDefaultSettings({
      isTouchscreen,
    }),
    dynamicResolutionURL: null,
  };

  const [settings, setSettings] = useLocalStorageObject<HexToolsGridSettings>({
    key: "staff-grid-settings",
    defaultValue: defaultSettings,
  });

  const hasDynamicResolutionURL = settings.dynamicResolutionURL != null;
  const [prevHasDynamicResolutionURL, setPrevHasDynamicResolutionURL] =
    useState(hasDynamicResolutionURL);
  if (hasDynamicResolutionURL !== prevHasDynamicResolutionURL) {
    setPrevHasDynamicResolutionURL(hasDynamicResolutionURL);
    setPatternType(
      hasDynamicResolutionURL ? PATTERN_TYPES.Unresolved : DEFAULT_PATTERN_TYPE,
    );
  }

  useHotkeys([
    ["Escape", () => staffGridRef.current?.cancelPattern()],
    ["mod+Z", () => patternsHandlers.back()],
    ["mod+Y", () => patternsHandlers.forward()],
    ["mod+shift+Z", () => patternsHandlers.forward()],
  ]);

  useDeviceMotion({
    shakeDuration: 1500,
    shakeThreshold: 15,
    onMeanAcceleration: (meanAcceleration) => {
      staffGridRef.current?.setZappyMultiplier(
        settings.zappyOnShake ? _.clamp(meanAcceleration / 5, 1, 3) : 1,
      );
    },
    onShake: () => {
      switch (settings.shakeAction) {
        case "none":
          break;
        case "undo":
          patternsHandlers.back();
          break;
        case "clear":
          patternsHandlers.set([]);
          break;
      }
    },
  });

  const onPanToPattern = (pattern: ResolvedPattern) => {
    staffGridRef.current?.panToPattern(pattern);
  };

  const onResetPanAndZoom = () => {
    staffGridRef.current?.resetPanAndZoom();
  };

  const onPatternDrawn = async (
    pattern: ResolvedPattern,
    newDrawTimeMs: number,
  ) => {
    setDrawTimeMs(newDrawTimeMs);
    setPrevDrawTimeMs(drawTimeMs);
    if (settings.dynamicResolutionURL != null) {
      const url = new URL("/resolve", settings.dynamicResolutionURL);
      url.searchParams.append("signature", pattern.pattern.signature);
      const response = await fetch(url, {
        method: "POST",
      });

      const rawType = (await response.json()) as string;
      const type =
        rawType in resolveResponseToType
          ? resolveResponseToType[rawType as keyof typeof resolveResponseToType]
          : PATTERN_TYPES.Unresolved;

      patternsHandlers.set(
        latestPatternsRef.current.map((other) =>
          HexCoord.equals(pattern.origin, other.origin)
          && pattern.pattern.signature === other.pattern.signature
            ? { ...other, type }
            : other,
        ),
      );
    }
  };

  return (
    <>
      <StaffGrid
        patterns={patterns}
        onPatternsChange={patternsHandlers.set}
        patternType={patternType}
        onPatternTypeChange={setPatternType}
        onPatternDrawn={onPatternDrawn}
        settings={settings}
        ref={staffGridRef}
      />

      {settings.showDrawTime && (
        <StaffGridTimer
          drawTimeMs={drawTimeMs}
          prevDrawTimeMs={prevDrawTimeMs}
        />
      )}

      <StaffGridControls
        patterns={patterns}
        patternsHandlers={patternsHandlers}
        patternsHistory={patternsHistory}
        patternType={patternType}
        onPatternTypeChange={setPatternType}
        settings={settings}
        onSettingsChange={setSettings}
        onResetSettings={() => setSettings(defaultSettings)}
        onPanToPattern={onPanToPattern}
        onResetPanAndZoom={onResetPanAndZoom}
      />
    </>
  );
}

const resolveResponseToType = {
  unresolved: PATTERN_TYPES.Unresolved,
  evaluated: PATTERN_TYPES.Evaluated,
  escaped: PATTERN_TYPES.Escaped,
  undone: PATTERN_TYPES.Undone,
  errored: PATTERN_TYPES.Errored,
  invalid: PATTERN_TYPES.Invalid,
};
