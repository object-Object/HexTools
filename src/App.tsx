import {
  ActionIcon,
  AppShell,
  Burger,
  Group,
  Stack,
  useMatches,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGithub } from "@tabler/icons-react";
import { Redirect, Route, Switch } from "wouter";

import ColorSchemeButton from "./components/ColorSchemeButton";
import HeaderNavLink from "./components/HeaderNavLink";
import StaffGrid from "./components/staffGrid/StaffGrid";
import SwindlerStacks from "./components/swindler/SwindlerStacks";

export default function App() {
  const mobileBreakpoint = "xs";
  const isMobile = useMatches({ base: true, [mobileBreakpoint]: false });
  const [sidebarOpen, { toggle: toggleSidebar, close: closeSidebar }] =
    useDisclosure();

  const navButtons = routes.map(({ path, label }) => (
    <HeaderNavLink
      key={path}
      path={path}
      label={label}
      onClick={closeSidebar}
    />
  ));

  return (
    <AppShell
      padding="md"
      header={{ height: 56 }}
      navbar={{
        width: "100%",
        breakpoint: mobileBreakpoint,
        collapsed: { desktop: true, mobile: !sidebarOpen },
      }}
    >
      <AppShell.Header>
        <Group h="100%" mx="xs" gap="xs" align="center">
          {isMobile ? (
            <Burger opened={sidebarOpen} onClick={toggleSidebar} />
          ) : (
            navButtons
          )}

          <ActionIcon
            variant="default"
            size="lg"
            ml="auto"
            component="a"
            href="https://github.com/object-Object/HexTools"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandGithub />
          </ActionIcon>

          <ColorSchemeButton variant="default" size="lg" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Stack m="xs" gap="xs">
          {navButtons}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Switch>
          {routes.map(({ path, component }) => (
            <Route key={path} path={path} component={component} />
          ))}

          <Route>
            <Redirect to={routes[0].path} />
          </Route>
        </Switch>
      </AppShell.Main>
    </AppShell>
  );
}

const routes = [
  { path: "/Swindler", label: "Swindler", component: SwindlerStacks },
  { path: "/StaffGrid", label: "Staff Grid", component: StaffGrid },
];
