import { useSortable } from "@dnd-kit/react/sortable";
import { ActionIcon, Group, Text } from "@mantine/core";
import {
  IconCopy,
  IconGripVertical,
  IconX,
  IconZoom,
} from "@tabler/icons-react";

import { HexPattern } from "@hextools/renderer/staffGrid";

export interface StaffGridSidebarPatternProps {
  id: string;
  index: number;
  pattern: HexPattern;
  name: string | null;
  onPan: () => unknown;
  onDelete: () => unknown;
}

export function StaffGridSidebarPattern({
  id,
  index,
  pattern,
  name,
  onPan,
  onDelete,
}: StaffGridSidebarPatternProps) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  const text = name ?? pattern.toString();
  return (
    <Group ref={ref} align="center" wrap="nowrap" gap="sm">
      <IconGripVertical
        ref={handleRef}
        style={{ cursor: isDragging ? "grabbing" : "grab", flexShrink: 0 }}
      />

      <Text
        ff="monospace"
        style={{
          textWrap: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={text}
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
