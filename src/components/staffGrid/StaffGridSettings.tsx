import { ActionIcon, Button, Modal, Stack, Switch } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSettings } from "@tabler/icons-react";

import type { GuiSpellcastingSettings } from "../../render/staffGrid/guiSpellcasting";
import { mod } from "../../utils/math";
import ControlledNumberInput from "../ControlledNumberInput";
import { staffGridButtonProps } from "./StaffGrid.lib";

export interface StaffGridSettingsProps {
  settings: GuiSpellcastingSettings;
  onSettingsChange: (value: GuiSpellcastingSettings) => unknown;
}

export default function StaffGridSettings({
  settings,
  onSettingsChange,
}: StaffGridSettingsProps) {
  const { guiScale, gridZoom, zappyVariance, ctrlTogglesOffStrokeOrder } =
    settings;
  const [opened, { open, close }] = useDisclosure(false);

  function getSetter<T extends keyof GuiSpellcastingSettings>(
    key: T,
  ): (value: GuiSpellcastingSettings[T]) => unknown {
    return (value) => {
      onSettingsChange({ ...settings, [key]: value });
    };
  }

  const setGuiScale = getSetter("guiScale");
  const setCtrlTogglesOffStrokeOrder = getSetter("ctrlTogglesOffStrokeOrder");

  return (
    <>
      <Modal opened={opened} onClose={close} title="Settings" centered>
        <Stack>
          <Button
            variant="default"
            onClick={(event) =>
              setGuiScale(mod(guiScale - 1 + (event.shiftKey ? -1 : 1), 5) + 1)
            }
          >
            GUI Scale: {guiScale}
          </Button>

          <ControlledNumberInput
            label="Grid Zoom"
            value={gridZoom}
            onChange={getSetter("gridZoom")}
            min={0.1}
            step={0.1}
          />

          <ControlledNumberInput
            label="Pattern Wobbliness"
            value={zappyVariance}
            onChange={getSetter("zappyVariance")}
            allowNegative={false}
            step={0.1}
          />

          <Switch
            label="Ctrl Toggles Off Stroke Order"
            checked={ctrlTogglesOffStrokeOrder}
            onChange={(event) =>
              setCtrlTogglesOffStrokeOrder(event.currentTarget.checked)
            }
          />
        </Stack>
      </Modal>

      <ActionIcon {...staffGridButtonProps} onClick={open}>
        <IconSettings />
      </ActionIcon>
    </>
  );
}
