import {
  AppShell,
  Button,
  Divider,
  Group,
  MantineProvider,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { useState } from "react";
import { Link, Redirect, Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

import ColorSchemeButton from "./components/ColorSchemeButton";
import StaffGrid from "./components/staffGrid/StaffGrid";
import SwindlerStacks from "./components/swindler/SwindlerStacks";
import { mod } from "./utils/math";

export default function App() {
  const [location] = useHashLocation();
  const [guiScale, setGuiScale] = useState(2);

  return (
    <MantineProvider defaultColorScheme="dark">
      <Router hook={useHashLocation}>
        <AppShell padding="md" header={{ height: 60 }}>
          <AppShell.Header>
            <Group h="100%" mx="sm" gap="sm" align="center">
              {[
                ["Swindler", "/Swindler"],
                ["Staff Grid", "/StaffGrid"],
              ].map(([title, href]) => (
                <Button
                  key={href}
                  variant={location.includes(href) ? "filled" : "default"}
                  component={Link}
                  href={href}
                >
                  {title}
                </Button>
              ))}
              <Route path="/StaffGrid">
                <Divider orientation="vertical" />
                <Button
                  variant="default"
                  onClick={(event) =>
                    setGuiScale(
                      mod(guiScale - 1 + (event.shiftKey ? -1 : 1), 5) + 1,
                    )
                  }
                >
                  GUI Scale: {guiScale}
                </Button>
              </Route>
              <Divider ml="auto" orientation="vertical" />
              <ColorSchemeButton
                display="inline-block"
                variant="default"
                size="lg"
              />
            </Group>
          </AppShell.Header>

          <AppShell.Main>
            <Switch>
              <Route path="/Swindler" component={SwindlerStacks} />

              <Route path="/StaffGrid">
                <StaffGrid guiScale={guiScale} />
              </Route>

              <Route>
                <Redirect to="/Swindler" />
              </Route>
            </Switch>
          </AppShell.Main>
        </AppShell>
      </Router>
    </MantineProvider>
  );
}
