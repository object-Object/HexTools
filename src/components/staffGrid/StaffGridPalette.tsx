import {
  ActionIcon,
  Combobox,
  Group,
  useCombobox,
  useMantineTheme,
} from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { useState } from "react";

import {
  PATTERN_TYPES,
  PATTERN_TYPES_VALUES,
  type NamedResolvedPatternType,
  type ResolvedPatternType,
} from "@hextools/renderer/staffGrid";

import { RGBColor } from "../../../packages/@hextools/renderer/src/colors";
import DoubleColorSwatch from "../DoubleColorSwatch";
import { staffGridButtonProps } from "./StaffGrid.lib";

export interface StaffGridPaletteProps {
  patternType: NamedResolvedPatternType;
  onPatternTypeChange: (patternType: NamedResolvedPatternType) => unknown;
}

export default function StaffGridPalette({
  patternType,
  onPatternTypeChange,
}: StaffGridPaletteProps) {
  const combobox = useCombobox();

  const theme = useMantineTheme();
  const activeColors = theme.variantColorResolver({
    theme,
    color: theme.primaryColor,
    variant: "filled",
  });

  const [customType, setCustomType] = useState<
    ResolvedPatternType & { name: typeof CUSTOM_NAME }
  >({
    ...PATTERN_TYPES.Evaluated,
    name: CUSTOM_NAME,
  });

  // TODO: implement
  const _updateCustomType = (overrides: Partial<ResolvedPatternType>) => {
    const newCustomType = { ...customType, ...overrides };
    setCustomType(newCustomType);
    if (patternType.name === CUSTOM_NAME) {
      onPatternTypeChange(customType);
    }
  };

  return (
    <Combobox
      store={combobox}
      position="left"
      width="max-content"
      onOptionSubmit={(value) => {
        onPatternTypeChange(
          value === CUSTOM_NAME
            ? customType
            : PATTERN_TYPES[value as keyof typeof PATTERN_TYPES],
        );
      }}
    >
      <Combobox.Target>
        <ActionIcon
          {...staffGridButtonProps}
          onClick={() => combobox.toggleDropdown()}
        >
          <IconPalette color={RGBColor.toCSS(patternType.color)} />
        </ActionIcon>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {PATTERN_TYPES_VALUES.map(({ name, color, fadeColor }) => (
            <Combobox.Option
              key={name}
              value={name}
              active={patternType.name === name}
              c={patternType.name === name ? activeColors.color : undefined}
              bg={
                patternType.name === name ? activeColors.background : undefined
              }
              onClick={() => combobox.closeDropdown()}
            >
              <Group align="center">
                <DoubleColorSwatch
                  leftColor={RGBColor.toCSS(color)}
                  rightColor={RGBColor.toCSS(fadeColor)}
                  size={20}
                />
                {name}
              </Group>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

const CUSTOM_NAME = "custom";
