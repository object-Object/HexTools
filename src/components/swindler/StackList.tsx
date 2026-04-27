import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { Stack } from "@mantine/core";
import { useState } from "react";

import StackIota from "./StackIota";

export default function StackList() {
  const [items, setItems] = useState([0, 1, 2, 3]);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        setItems((items) => move(items, event));
      }}
      modifiers={[
        RestrictToElement.configure({
          element(operation) {
            return operation.source?.element?.parentElement ?? null;
          },
        }),
      ]}
    >
      <Stack>
        {items.map((id, index) => (
          <StackIota key={id} id={id} index={index} />
        ))}
      </Stack>
    </DragDropProvider>
  );
}
