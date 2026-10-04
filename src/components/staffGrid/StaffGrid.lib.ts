import type { ActionIconProps } from "@mantine/core";

import type { GuiSpellcastingSettings } from "@hextools/renderer/staffGrid";

export const staffGridButtonProps = {
  variant: "default",
  size: "xl",
} satisfies ActionIconProps;

export interface HexToolsGridSettings extends GuiSpellcastingSettings {
  dynamicResolutionURL: string | null;
}
