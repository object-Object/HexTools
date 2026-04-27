import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import StackList, { type StackListProps } from "./StackList";

interface WrapperProps extends Omit<
  StackListProps,
  "items" | "onItemsChange"
> {}

function Wrapper(props: WrapperProps) {
  const [items, setItems] = useState(
    [1, 2, 3, 4].map((v) => ({ id: v, value: v.toString() })),
  );
  return <StackList items={items} onItemsChange={setItems} {...props} />;
}

const meta = {
  component: Wrapper,
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mirrored: Story = {
  args: {
    mirrored: true,
  },
};
