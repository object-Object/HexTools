import type { Meta, StoryObj } from "@storybook/react-vite";

import StaffGrid from "./StaffGrid";

const meta = {
  component: StaffGrid,
  args: {
    guiScale: 1,
  },
} satisfies Meta<typeof StaffGrid>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
