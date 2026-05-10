import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Popover,
  Stack,
  Text,
} from "@mantine/core";
import {
  useDisclosure,
  type UseStateHistoryHandlers,
  type UseStateHistoryValue,
} from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconMenu2,
  IconShare2,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";

import {
  HexCoord,
  type GuiSpellcastingSettings,
  type ResolvedPattern,
} from "@hextools/renderer/staffGrid";

import { staffGridButtonProps } from "./StaffGrid.lib";
import StaffGridSettings from "./StaffGridSettings";
import StaffGridSidebarPattern from "./StaffGridSidebarPattern";

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

  const [popoverOpen, setPopoverOpen] = useState(false);

  const copyAndClosePopover = (text: string) => {
    void navigator.clipboard.writeText(text);
    setPopoverOpen(false);
  };

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
        title={
          <Group gap="md">
            <Text fw="bold">Patterns</Text>
            {patterns.length > 0 && (
              <Popover opened={popoverOpen} onChange={setPopoverOpen}>
                <Popover.Target>
                  <ActionIcon
                    variant="transparent"
                    size="sm"
                    onClick={() => setPopoverOpen((open) => !open)}
                  >
                    <IconShare2 />
                  </ActionIcon>
                </Popover.Target>

                <Popover.Dropdown>
                  <Stack gap="sm">
                    <Button
                      variant="default"
                      onClick={() =>
                        copyAndClosePopover(
                          patterns
                            .map(({ pattern }) => pattern.toString())
                            .join("\n"),
                        )
                      }
                    >
                      Copy angle signatures
                    </Button>

                    <Button
                      variant="default"
                      onClick={() =>
                        copyAndClosePopover(
                          `/patterns hex hex:${patterns.map(({ pattern }) => pattern.toShorthand()).join(",")}`,
                        )
                      }
                    >
                      Copy HexBug command
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            )}
          </Group>
        }
        position="right"
        opened={sidebarOpen}
        onClose={closeSidebar}
      >
        <Stack gap="xs">
          {patterns.map(({ pattern, origin }, index) => (
            <StaffGridSidebarPattern
              key={HexCoord.toString(origin)}
              pattern={pattern}
              onDelete={() => {
                patternsHandlers.set(
                  patterns.filter((_resolved, i) => i !== index),
                );
              }}
            />
          ))}
        </Stack>
      </Drawer>
    </>
  );
}
