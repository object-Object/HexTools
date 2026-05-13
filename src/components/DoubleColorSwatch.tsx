import { Box, ColorSwatch, type ColorSwatchProps } from "@mantine/core";

import styles from "./DoubleColorSwatch.module.css";

export interface DoubleColorSwatchProps extends Omit<
  ColorSwatchProps,
  "color" | "children"
> {
  leftColor: string;
  rightColor: string;
}

export default function DoubleColorSwatch({
  leftColor,
  rightColor,
  ...passThroughProps
}: DoubleColorSwatchProps) {
  return (
    <Box display="grid">
      <ColorSwatch
        {...passThroughProps}
        color={leftColor}
        className={styles.left}
      />
      {leftColor !== rightColor && (
        <ColorSwatch
          {...passThroughProps}
          color={rightColor}
          className={styles.right}
        />
      )}
    </Box>
  );
}
