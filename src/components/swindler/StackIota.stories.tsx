import type { Meta, StoryObj } from "@storybook/react-vite";

import StackIota from "./StackIota";

const meta = {
  component: StackIota,
} satisfies Meta<typeof StackIota>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
