import type { Meta, StoryObj } from "@storybook/react-vite";

import StaffGridPage from "./StaffGridPage";

const meta = {
  component: StaffGridPage,
  args: {
    guiScale: 1,
  },
} satisfies Meta<typeof StaffGridPage>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
