import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { StaffGridSidebarPattern } from "@hextools/react";
import { HexDir, HexPattern } from "@hextools/renderer/staffGrid";

const meta = {
  component: StaffGridSidebarPattern,
  args: {
    id: "0",
    index: 0,
    pattern: HexPattern.fromSignature(HexDir.SOUTH_EAST, "deaqq"),
    name: null,
    onPan: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof StaffGridSidebarPattern>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithName: Story = {
  args: {
    name: "Pattern Name",
  },
};
