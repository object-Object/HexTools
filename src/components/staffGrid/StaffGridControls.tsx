import { ActionIcon, Drawer, Group, Stack, Text } from "@mantine/core";
import {
  useDisclosure,
  type UseStateHistoryHandlers,
  type UseStateHistoryValue,
} from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCopy,
  IconMenu2,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import _ from "lodash";

import {
  type GuiSpellcastingSettings,
  type ResolvedPattern,
} from "hextools-renderer/staffGrid/guiSpellcasting";
import { HexCoord, HexDir } from "hextools-renderer/staffGrid/hexMath";

import { staffGridButtonProps } from "./StaffGrid.lib";
import StaffGridSettings from "./StaffGridSettings";

export interface StaffGridControlsProps {
  patterns: ResolvedPattern[];
  patternsHandlers: UseStateHistoryHandlers<ResolvedPattern[]>;
  patternsHistory: UseStateHistoryValue<ResolvedPattern[]>;
  settings: GuiSpellcastingSettings;
  onSettingsChange: (settings: GuiSpellcastingSettings) => unknown;
  onResetSettings: () => unknown;
}

export default function StaffGridControls({
  patterns,
  patternsHandlers,
  patternsHistory,
  settings,
  onSettingsChange,
  onResetSettings,
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
      </Stack>

      <Drawer
        title="Patterns"
        position="right"
        opened={sidebarOpen}
        onClose={closeSidebar}
      >
        <Stack gap="xs">
          {patterns.map(({ pattern, origin }, index) => {
            const signature = pattern.anglesSignature();
            const text = `${HexDir[pattern.startDir]} ${signature}`;
            return (
              <Group
                key={HexCoord.toString(origin)}
                align="center"
                wrap="nowrap"
                gap="xs"
              >
                <Text
                  ff="monospace"
                  style={{
                    textWrap: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {text}
                </Text>

                <ActionIcon
                  variant="transparent"
                  size="sm"
                  ml="auto"
                  onClick={() => void navigator.clipboard.writeText(text)}
                >
                  <IconCopy />
                </ActionIcon>

                <ActionIcon
                  variant="transparent"
                  size="sm"
                  onClick={() =>
                    patternsHandlers.set(patterns.filter((_, i) => i !== index))
                  }
                >
                  <IconX />
                </ActionIcon>
              </Group>
            );
          })}
        </Stack>
      </Drawer>
    </>
  );
}
