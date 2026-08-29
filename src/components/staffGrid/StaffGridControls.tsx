import { ActionIcon, Stack } from "@mantine/core";
import {
  useDisclosure,
  type UseStateHistoryHandlers,
  type UseStateHistoryValue,
} from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconFocusCentered,
  IconMenu2,
  IconTrash,
} from "@tabler/icons-react";

import { StaffGridSidebar, type StaffGridSidebarProps } from "@hextools/react";
import { type ResolvedPattern } from "@hextools/renderer/staffGrid";

import { staffGridButtonProps } from "./StaffGrid.lib";
import type { StaffGridPaletteProps } from "./StaffGridPalette";
import StaffGridPalette from "./StaffGridPalette";
import StaffGridSettings, {
  type StaffGridSettingsProps,
} from "./StaffGridSettings";

export interface StaffGridControlsProps
  extends
    StaffGridPaletteProps,
    StaffGridSettingsProps,
    Pick<StaffGridSidebarProps, "onPanToPattern"> {
  patterns: readonly ResolvedPattern[];
  patternsHandlers: UseStateHistoryHandlers<readonly ResolvedPattern[]>;
  patternsHistory: UseStateHistoryValue<readonly ResolvedPattern[]>;
  onResetPanAndZoom: () => unknown;
}

export default function StaffGridControls({
  patterns,
  patternsHandlers,
  patternsHistory,
  patternType,
  onPatternTypeChange,
  settings,
  onSettingsChange,
  onResetSettings,
  onPanToPattern,
  onResetPanAndZoom,
}: StaffGridControlsProps) {
  const [sidebarOpen, { toggle: toggleSidebar, close: closeSidebar }] =
    useDisclosure(false);

  return (
    <>
      <Stack gap="xs" pos="absolute" top={16} right={16}>
        <StaffGridSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
          onResetSettings={onResetSettings}
        />

        <ActionIcon {...staffGridButtonProps} onClick={toggleSidebar}>
          <IconMenu2 />
        </ActionIcon>

        <StaffGridPalette
          patternType={patternType}
          onPatternTypeChange={onPatternTypeChange}
        />

        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => patternsHandlers.back()}
          disabled={patternsHistory.current === 0}
        >
          <IconArrowBackUp />
        </ActionIcon>

        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => patternsHandlers.forward()}
          disabled={
            patternsHistory.current === patternsHistory.history.length - 1
          }
        >
          <IconArrowForwardUp />
        </ActionIcon>

        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => patternsHandlers.set([])}
          disabled={patterns.length === 0}
        >
          <IconTrash />
        </ActionIcon>

        <ActionIcon {...staffGridButtonProps} onClick={onResetPanAndZoom}>
          <IconFocusCentered />
        </ActionIcon>
      </Stack>

      <StaffGridSidebar
        patterns={patterns}
        onPatternsChange={patternsHandlers.set}
        onPanToPattern={onPanToPattern}
        opened={sidebarOpen}
        onClose={closeSidebar}
      />
    </>
  );
}
