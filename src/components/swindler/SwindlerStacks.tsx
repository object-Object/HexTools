import { Group, NumberInput, Stack } from "@mantine/core";
import { useState } from "react";

import StackList from "./StackList";

export default function SwindlerStacks() {
  const [lehmer, setLehmer] = useState<string>("0");
  const [left, setLeft] = useState([{ id: 0, value: "" }]);
  const [right, setRight] = useState(left);

  return (
    <Stack>
      <NumberInput
        value={lehmer ?? ""}
        label="Lehmer Code"
        onValueChange={({ formattedValue }) => {
          setLehmer(formattedValue);
        }}
        onBlur={() => {
          setLehmer((lehmer) => parseInt(lehmer || "0").toString());
        }}
        allowNegative={false}
        allowDecimal={false}
      />
      <Group grow gap="lg" align="flex-start">
        <StackList items={left} onItemsChange={setLeft} />
        <StackList items={right} onItemsChange={setRight} mirrored />
      </Group>
    </Stack>
  );
}
