import { Button, Stack, Text } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  useDeviceMotion,
  useRequestDeviceMotionPermission,
} from "./useDeviceMotion";

function UseDeviceMotionTestScreen() {
  const { acceleration, isShaking } = useDeviceMotion({
    shakeDuration: 1000,
    shakeThreshold: 20,
  });
  const { canRequestPermission, requestPermission } =
    useRequestDeviceMotionPermission();

  return (
    <Stack bg={isShaking ? "red" : undefined}>
      <Text>{acceleration.toFixed(1)}</Text>
      <Button
        onClick={() => void requestPermission()}
        disabled={!canRequestPermission}
      >
        Request permission
      </Button>
    </Stack>
  );
}

const meta = {
  component: UseDeviceMotionTestScreen,
} satisfies Meta<typeof useDeviceMotion>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
