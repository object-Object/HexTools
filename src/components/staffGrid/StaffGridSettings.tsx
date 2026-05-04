import {
  ActionIcon,
  Button,
  InputWrapper,
  Modal,
  SegmentedControl,
  Stack,
  Switch,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconSettings } from "@tabler/icons-react";

import { useRequestDeviceMotionPermission } from "../../hooks/useDeviceMotion";
import type { GuiSpellcastingSettings } from "../../render/staffGrid/guiSpellcasting";
import { mod } from "../../utils/math";
import type { KeysOfValue } from "../../utils/types";
import ControlledNumberInput from "../ControlledNumberInput";
import { staffGridButtonProps } from "./StaffGrid.lib";

export interface StaffGridSettingsProps {
  settings: GuiSpellcastingSettings;
  onSettingsChange: (value: GuiSpellcastingSettings) => unknown;
  onResetSettings: () => unknown;
}

export default function StaffGridSettings({
  settings,
  onSettingsChange,
  onResetSettings,
}: StaffGridSettingsProps) {
  const {
    guiScale,
    gridZoom,
    enableZappyPoints,
    zappyVariance,
    ctrlTogglesOffStrokeOrder,
    dotsMode,
    mouseDotsRadius,
    clickingTogglesDrawing,
    zappyOnShake,
    shakeAction,
  } = settings;

  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useMediaQuery("(max-width: 30em)");

  const {
    canRequestPermission: canRequestMotionPermission,
    requestPermission: requestMotionPermission,
  } = useRequestDeviceMotionPermission();

  const requestMotionPermissionError = !canRequestMotionPermission
    ? "Device motion permission denied :("
    : null;

  function getSetter<T extends keyof GuiSpellcastingSettings>(
    key: T,
  ): (value: GuiSpellcastingSettings[T]) => unknown {
    return (value) => {
      onSettingsChange({ ...settings, [key]: value });
    };
  }

  function getSwitchSetter<
    T extends KeysOfValue<GuiSpellcastingSettings, boolean>,
  >(key: T): (event: React.ChangeEvent<HTMLInputElement>) => unknown {
    const setter = getSetter(key);
    return (event) => {
      setter(event.currentTarget.checked);
    };
  }

  const setGuiScale = getSetter("guiScale");
  const setZappyOnShake = getSetter("zappyOnShake");
  const setShakeAction = getSetter("shakeAction");

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        fullScreen={isMobile}
        title="Settings"
      >
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
            allowNegative={false}
            min={0.25}
            step={0.25}
          />

          <Switch
            label="Enable Wobbly Patterns"
            checked={enableZappyPoints}
            onChange={getSwitchSetter("enableZappyPoints")}
          />

          {enableZappyPoints && (
            <>
              <Switch
                label="Patterns Wobble On Shake"
                checked={zappyOnShake}
                disabled={!canRequestMotionPermission}
                error={requestMotionPermissionError}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onChange={async (value) => {
                  setZappyOnShake(
                    value.currentTarget.checked
                      && (await requestMotionPermission()),
                  );
                }}
              />
              <ControlledNumberInput
                label="Pattern Wobbliness"
                value={zappyVariance}
                onChange={getSetter("zappyVariance")}
                allowNegative={false}
                step={0.1}
              />
            </>
          )}

          <Switch
            label="Ctrl Toggles Off Stroke Order"
            checked={ctrlTogglesOffStrokeOrder}
            onChange={getSwitchSetter("ctrlTogglesOffStrokeOrder")}
          />

          <Switch
            label="Clicking Toggles Drawing"
            checked={clickingTogglesDrawing}
            onChange={getSwitchSetter("clickingTogglesDrawing")}
          />

          <InputWrapper
            label="Action On Shake"
            error={requestMotionPermissionError}
            labelElement="div"
          >
            <SegmentedControl
              value={shakeAction}
              disabled={!canRequestMotionPermission}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onChange={async (value) => {
                setShakeAction(
                  value !== "none" && (await requestMotionPermission())
                    ? value
                    : "none",
                );
              }}
              data={[
                { label: "None", value: "none" },
                { label: "Undo", value: "undo" },
                { label: "Clear Grid", value: "clear" },
              ]}
              fullWidth
            />
          </InputWrapper>

          <InputWrapper label="Grid Dots Mode" labelElement="div">
            <SegmentedControl
              value={dotsMode}
              onChange={getSetter("dotsMode")}
              data={[
                { label: "None", value: "none" },
                { label: "Around Mouse", value: "mouse" },
                { label: "Full Grid", value: "all" },
              ]}
              fullWidth
            />
          </InputWrapper>

          {dotsMode === "mouse" && (
            <ControlledNumberInput
              label="Mouse Dots Radius"
              value={mouseDotsRadius}
              onChange={getSetter("mouseDotsRadius")}
              allowNegative={false}
              allowDecimal={false}
              min={1}
            />
          )}

          <Button variant="light" color="red" onClick={onResetSettings}>
            Reset All Settings
          </Button>
        </Stack>
      </Modal>

      <ActionIcon {...staffGridButtonProps} onClick={open}>
        <IconSettings />
      </ActionIcon>
    </>
  );
}
