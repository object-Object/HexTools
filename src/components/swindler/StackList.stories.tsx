import type { Meta, StoryObj } from "@storybook/react-vite";

import StackList from "./StackList";

const meta = {
  component: StackList,
} satisfies Meta<typeof StackList>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
