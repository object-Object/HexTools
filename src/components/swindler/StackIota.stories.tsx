import { DragDropProvider } from "@dnd-kit/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import StackIota from "./StackIota";

const meta = {
  component: StackIota,
  args: {
    id: 0,
    index: 0,
  },
  render: (args) => (
    <DragDropProvider>
      <StackIota {...args} />
    </DragDropProvider>
  ),
} satisfies Meta<typeof StackIota>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
