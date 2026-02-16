import { useSortable } from "@dnd-kit/react/sortable";
import { Group, TextInput } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";

export interface StackIotaProps {
  id: number;
  index: number;
}

export default function StackIota({ id, index }: StackIotaProps) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  return (
    <Group ref={ref} wrap="nowrap">
      <IconGripVertical
        ref={handleRef}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      />
      <TextInput style={{ flexGrow: 1 }} />
    </Group>
  );
}
