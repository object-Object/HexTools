import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { ActionIcon, Stack } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import _ from "lodash";

import {
  removeIndex,
  replaceIndex,
  replaceIndexFlat,
} from "../../utils/arrays";
import type { SetState } from "../../utils/types";
import StackIota, { type StackIotaData } from "./StackIota";

export interface StackListProps {
  items: StackIotaData[];
  onItemsChange: SetState<StackIotaData[]>;
  mirrored?: boolean;
}

export default function StackList({
  items,
  onItemsChange,
  mirrored,
}: StackListProps) {
  return (
    <div>
      <DragDropProvider
        onDragEnd={(event) => {
          onItemsChange((items) => move(items, event));
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
          {items.map((data, index) => (
            <StackIota
              key={data.id}
              {...data}
              index={index}
              onChange={(value) => {
                onItemsChange(
                  replaceIndex(items, index, (current) => ({
                    ...current,
                    value,
                  })),
                );
              }}
              onInsertBelow={() => {
                onItemsChange(
                  replaceIndexFlat(items, index, (current) => [
                    current,
                    { id: getNextId(items), value: "" },
                  ]),
                );
              }}
              onRemove={() => {
                if (items.length > 1) {
                  onItemsChange(removeIndex(items, index));
                }
              }}
              mirrored={mirrored}
            />
          ))}
        </Stack>
        <ActionIcon
          mt="sm"
          display="block"
          ml={mirrored ? "auto" : undefined}
          onClick={() => {
            onItemsChange([...items, { id: getNextId(items), value: "" }]);
          }}
        >
          <IconPlus />
        </ActionIcon>
      </DragDropProvider>
    </div>
  );
}

function getNextId(items: StackIotaData[]): number {
  const maxId = _.max(items.map((item) => item.id)) ?? 0;
  return maxId + 1;
}
