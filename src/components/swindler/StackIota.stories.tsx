import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import StackIota, { type StackIotaProps } from "./StackIota";

interface WrapperProps extends Omit<StackIotaProps, "onChange"> {}

function Wrapper(props: WrapperProps) {
  const [value, setValue] = useState(props.value);
  return <StackIota {...props} value={value} onChange={setValue} />;
}

const meta = {
  component: Wrapper,
  args: {
    id: 0,
    value: "Value",
    index: 0,
    onInsertBelow: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mirrored: Story = {
  args: {
    mirrored: true,
  },
};
