import { Group, TextInput } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";

export default function StackIota() {
  return (
    <Group wrap="nowrap">
      <IconGripVertical />
      <TextInput style={{ flexGrow: 1 }} />
    </Group>
  );
}
