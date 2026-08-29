import { ActionIcon, Group, Text } from "@mantine/core";
import { IconCopy, IconX, IconZoom } from "@tabler/icons-react";

import { HexPattern } from "@hextools/renderer/staffGrid";

export interface StaffGridSidebarPatternProps {
  pattern: HexPattern;
  onPan: () => unknown;
  onDelete: () => unknown;
}

export function StaffGridSidebarPattern({
  pattern,
  onPan,
  onDelete,
}: StaffGridSidebarPatternProps) {
  const text = pattern.toString();
  return (
    <Group align="center" wrap="nowrap" gap="sm">
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

      <ActionIcon variant="transparent" size="sm" ml="auto" onClick={onPan}>
        <IconZoom />
      </ActionIcon>

      <ActionIcon
        variant="transparent"
        size="sm"
        onClick={() => void navigator.clipboard.writeText(text)}
      >
        <IconCopy />
      </ActionIcon>

      <ActionIcon variant="transparent" size="sm" onClick={onDelete}>
        <IconX />
      </ActionIcon>
    </Group>
  );
}
