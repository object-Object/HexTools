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
import StackIota, { type StackIotaData } from "./StackIota";

export interface StackListProps {
  items: StackIotaData[];
  onItemsChange: (items: StackIotaData[]) => unknown;
  allowInsert?: boolean;
  mirrored?: boolean;
}

export default function StackList({
  items,
  onItemsChange,
  allowInsert,
  mirrored,
}: StackListProps) {
  return (
    <div>
      <DragDropProvider
        onDragEnd={(event) => {
          onItemsChange(move(items, event));
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
                if (allowInsert) {
                  onItemsChange(
                    replaceIndexFlat(items, index, (current) => [
                      current,
                      { id: getNextId(items), value: "" },
                    ]),
                  );
                }
              }}
              onRemove={() => {
                if (allowInsert && items.length > 1) {
                  onItemsChange(removeIndex(items, index));
                }
              }}
              mirrored={mirrored}
              autoFocus={allowInsert}
            />
          ))}
        </Stack>
        {allowInsert && (
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
        )}
      </DragDropProvider>
    </div>
  );
}

function getNextId(items: StackIotaData[]): number {
  const maxId = _.max(items.map((item) => item.id)) ?? 0;
  return maxId + 1;
}
