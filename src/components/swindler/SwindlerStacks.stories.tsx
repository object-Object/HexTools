import type { Meta, StoryObj } from "@storybook/react-vite";

import SwindlerStacks from "./SwindlerStacks";

const meta = {
  component: SwindlerStacks,
} satisfies Meta<typeof SwindlerStacks>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
