import { ActionIcon, Button, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSettings } from "@tabler/icons-react";

import { mod } from "../../utils/math";

export interface StaffGridSettingsProps {
  guiScale: number;
  setGuiScale: (guiScale: number) => unknown;
}

export default function StaffGridSettings({
  guiScale,
  setGuiScale,
}: StaffGridSettingsProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} title="Settings" centered>
        <Stack>
          <Button
            onClick={(event) => {
              setGuiScale(mod(guiScale - 1 + (event.shiftKey ? -1 : 1), 5) + 1);
            }}
          >
            GUI Scale: {guiScale}
          </Button>
        </Stack>
      </Modal>

      <ActionIcon variant="default" size="lg" onClick={open}>
        <IconSettings />
      </ActionIcon>
    </>
  );
}
