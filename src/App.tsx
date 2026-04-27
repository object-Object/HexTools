import { Container, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import SwindlerStacks from "./components/swindler/SwindlerStacks";

export default function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      {/* TODO: dark mode switcher, rest of app */}
      <Container>
        <SwindlerStacks />
      </Container>
    </MantineProvider>
  );
}
