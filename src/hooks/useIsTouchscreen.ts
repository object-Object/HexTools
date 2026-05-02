import { useMediaQuery } from "@mantine/hooks";

export function useIsTouchscreen() {
  return useMediaQuery("(pointer: coarse)", undefined, {
    getInitialValueInEffect: false,
  });
}
