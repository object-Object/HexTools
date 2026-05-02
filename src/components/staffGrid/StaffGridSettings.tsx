import { ActionIcon, Button, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSettings } from "@tabler/icons-react";

import { mod } from "../../utils/math";
import ControlledNumberInput from "../ControlledNumberInput";

export interface StaffGridSettingsProps {
  guiScale: number;
  setGuiScale: (value: number) => unknown;
  gridZoom: number;
  setGridZoom: (value: number) => unknown;
  zappyVariance: number;
  setZappyVariance: (value: number) => unknown;
}

export default function StaffGridSettings({
  guiScale,
  setGuiScale,
  gridZoom,
  setGridZoom,
  zappyVariance,
  setZappyVariance,
}: StaffGridSettingsProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} title="Settings" centered>
        <Stack>
          <Button
            variant="default"
            onClick={(event) => {
              setGuiScale(mod(guiScale - 1 + (event.shiftKey ? -1 : 1), 5) + 1);
            }}
          >
            GUI Scale: {guiScale}
          </Button>

          <ControlledNumberInput
            label="Grid Zoom"
            value={gridZoom}
            onChange={setGridZoom}
            min={0.1}
            step={0.1}
          />

          <ControlledNumberInput
            label="Pattern Wobbliness"
            value={zappyVariance}
            onChange={setZappyVariance}
            allowNegative={false}
            step={0.1}
          />
        </Stack>
      </Modal>

      <ActionIcon variant="default" size="lg" onClick={open}>
        <IconSettings />
      </ActionIcon>
    </>
  );
}
