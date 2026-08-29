import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Popover,
  Stack,
  Text,
  type DrawerProps,
} from "@mantine/core";
import { IconShare2 } from "@tabler/icons-react";
import { useState } from "react";

import { HexCoord, type ResolvedPattern } from "@hextools/renderer/staffGrid";

import { StaffGridSidebarPattern } from "./StaffGridSidebarPattern";

export interface StaffGridSidebarProps extends Pick<
  DrawerProps,
  "opened" | "onClose"
> {
  patterns: readonly ResolvedPattern[];
  onPatternsChange: (patterns: readonly ResolvedPattern[]) => unknown;
  onPanToPattern: (pattern: ResolvedPattern) => unknown;
}

export function StaffGridSidebar({
  patterns,
  onPatternsChange,
  onPanToPattern,
  opened,
  onClose,
}: StaffGridSidebarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const copyAndClosePopover = (text: string) => {
    void navigator.clipboard.writeText(text);
    setPopoverOpen(false);
  };

  const popover = (
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
                patterns.map(({ pattern }) => pattern.toString()).join("\n"),
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
  );

  return (
    <Drawer
      title={
        <Group gap="md">
          <Text fw="bold">Patterns</Text>
          {patterns.length > 0 && popover}
        </Group>
      }
      position="right"
      opened={opened}
      onClose={onClose}
    >
      <DragDropProvider
        onDragEnd={(event) => {
          onPatternsChange(
            // hacky hacky hack
            move(
              patterns.map((pattern) => ({
                ...pattern,
                id: HexCoord.toString(pattern.origin),
              })),
              event,
            ).map(({ id: _, ...pattern }) => pattern),
          );
        }}
        modifiers={[
          RestrictToElement.configure({
            element(operation) {
              return operation.source?.element?.parentElement ?? null;
            },
          }),
        ]}
      >
        <Stack gap="xs">
          {patterns.map((pattern, index) => (
            <StaffGridSidebarPattern
              key={HexCoord.toString(pattern.origin)}
              id={HexCoord.toString(pattern.origin)}
              index={index}
              pattern={pattern.pattern}
              onPan={() => {
                onPanToPattern(pattern);
                onClose();
              }}
              onDelete={() => {
                onPatternsChange(
                  patterns.filter((_resolved, i) => i !== index),
                );
              }}
            />
          ))}
        </Stack>
      </DragDropProvider>
    </Drawer>
  );
}
