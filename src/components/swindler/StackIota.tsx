import { useSortable } from "@dnd-kit/react/sortable";
import { Group, TextInput } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";

export interface StackIotaData {
  id: number;
  value: string;
}

export interface StackIotaProps extends StackIotaData {
  index: number;
  onChange: (value: string) => unknown;
  onInsertBelow: () => unknown;
  onRemove: () => unknown;
  mirrored?: boolean;
}

export default function StackIota({
  id,
  index,
  value,
  onChange,
  onInsertBelow,
  onRemove,
  mirrored,
}: StackIotaProps) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  const grip = (
    <IconGripVertical
      ref={handleRef}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    />
  );

  return (
    <Group ref={ref} wrap="nowrap" gap="xs">
      {!mirrored && grip}
      <TextInput
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onInsertBelow();
          }
        }}
        onBlur={(a) => {
          if (!a.target.value) {
            onRemove();
          }
        }}
        style={{ flexGrow: 1 }}
        autoFocus={value === ""}
      />
      {mirrored && grip}
    </Group>
  );
}
