import { useHotkeys, useStateHistory } from "@mantine/hooks";
import _ from "lodash";
import { useRef, useState } from "react";

import { StaffGrid, type StaffGridRef, useDeviceMotion } from "@hextools/react";
import { useIsTouchscreen } from "@hextools/react";
import { useLocalStorageObject } from "@hextools/react";
import {
  DEFAULT_PATTERN_TYPE,
  GuiSpellcasting,
  type GuiSpellcastingSettings,
  type ResolvedPattern,
} from "@hextools/renderer/staffGrid";

import StaffGridControls from "./StaffGridControls";

export default function StaffGridPage() {
  const isTouchscreen = useIsTouchscreen();

  const [patterns, patternsHandlers, patternsHistory] = useStateHistory<
    readonly ResolvedPattern[]
  >([]);

  const [patternType, setPatternType] = useState(DEFAULT_PATTERN_TYPE);

  const staffGridRef = useRef<StaffGridRef>(null);

  const defaultSettings = GuiSpellcasting.getDefaultSettings({
    isTouchscreen,
  });

  const [settings, setSettings] =
    useLocalStorageObject<GuiSpellcastingSettings>({
      key: "staff-grid-settings",
      defaultValue: defaultSettings,
    });

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

  return (
    <>
      <StaffGrid
        patterns={patterns}
        onPatternsChange={patternsHandlers.set}
        patternType={patternType}
        onPatternTypeChange={setPatternType}
        settings={settings}
        ref={staffGridRef}
      />

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
