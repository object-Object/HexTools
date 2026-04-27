import { Group, NumberInput, Stack } from "@mantine/core";
import { useState } from "react";

import type { StackIotaData } from "./StackIota";
import StackList from "./StackList";

export default function SwindlerStacks() {
  const [lehmer, setLehmer] = useState<number | undefined>(0);
  const [left, setLeft] = useState([{ id: 0, value: "" }]);
  const [right, setRight] = useState(left);

  const handleLehmerChange = (newLehmer: number | undefined) => {
    const newRight = applyLehmer(left, newLehmer ?? 0);
    if (newRight) {
      setLehmer(newLehmer);
      setRight(newRight);
    }
  };

  const handleLeftChange = (newLeft: StackIotaData[]) => {
    setLeft(newLeft);
    const newRight = applyLehmer(newLeft, lehmer ?? 0);
    if (newRight) {
      setRight(newRight);
    } else {
      setRight(newLeft);
      setLehmer(0);
    }
  };

  const handleRightChange = (newRight: StackIotaData[]) => {
    setRight(newRight);
    setLehmer(calculateLehmer(left, newRight));
  };

  return (
    <Stack>
      <NumberInput
        value={lehmer ?? ""}
        label="Lehmer Code"
        onValueChange={({ floatValue }) => {
          handleLehmerChange(floatValue);
        }}
        onBlur={() => {
          handleLehmerChange(lehmer ?? 0);
        }}
        allowNegative={false}
        allowDecimal={false}
      />
      <Group grow gap="lg" align="flex-start">
        <StackList items={left} onItemsChange={handleLeftChange} allowInsert />
        <StackList items={right} onItemsChange={handleRightChange} mirrored />
      </Group>
    </Stack>
  );
}

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/common/casting/actions/stack/OpAlwinfyHasAscendedToABeingOfPureMath.kt
function applyLehmer<T>(stack: T[], code: number): T[] | null {
  const strides = [];
  let acc = 1;
  let n = 1;
  while (acc <= code) {
    strides.push(acc);
    acc *= n;
    n++;
  }

  if (strides.length > stack.length) {
    return null;
  }

  const newStack = [...stack].reverse();
  let editTargetStart = newStack.length - strides.length;
  const swap = newStack.slice(editTargetStart);
  let radix = code;
  for (const divisor of strides.reverse()) {
    const index = radix / divisor;
    radix %= divisor;
    newStack[editTargetStart] = swap.splice(Math.floor(index), 1)[0];
    editTargetStart++;
  }

  return newStack.reverse();
}

// https://github.com/object-Object/HexBug/blob/92b39114854be7fe96e0172c3e2bbc8138c8c30a/data/src/HexBug/data/utils/lehmer.py
function calculateLehmer<T>(beforeReversed: T[], afterReversed: T[]): number {
  const n = afterReversed.length;
  if (n > beforeReversed.length) {
    return 0;
  }

  const before = [...beforeReversed].reverse().slice(-n);
  const after = [...afterReversed].reverse();

  const stack = [1];
  for (let i = 1; i < n; i++) {
    stack.push(stack[stack.length - 1] * i);
  }

  let count = 0;
  for (const val of after) {
    const ix = before.indexOf(val);
    count += (stack.pop() ?? 0) * ix;
    before.splice(ix, 1);
  }

  return count;
}
