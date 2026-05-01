import {
  ActionIcon,
  useMantineColorScheme,
  type ActionIconProps,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ColorSchemeButton(props: ActionIconProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon {...props} onClick={toggleColorScheme}>
      {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
    </ActionIcon>
  );
}
