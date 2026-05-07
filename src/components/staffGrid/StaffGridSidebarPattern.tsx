import { ActionIcon, Group, Text } from "@mantine/core";
import { IconCopy, IconX } from "@tabler/icons-react";

import { HexPattern } from "hextools-renderer/staffGrid/hexMath";

export interface StaffGridSidebarPatternProps {
  pattern: HexPattern;
  onDelete: () => unknown;
}

export default function StaffGridSidebarPattern({
  pattern,
  onDelete,
}: StaffGridSidebarPatternProps) {
  const text = pattern.toString();
  return (
    <Group align="center" wrap="nowrap" gap="xs">
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

      <ActionIcon variant="transparent" size="sm" onClick={onDelete}>
        <IconX />
      </ActionIcon>
    </Group>
  );
}
