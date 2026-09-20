import { NumberFormatter, Paper, Text } from "@mantine/core";

export interface StaffGridTimerProps {
  drawTimeMs: number | null;
  prevDrawTimeMs: number | null;
}

export default function StaffGridTimer({
  drawTimeMs,
  prevDrawTimeMs,
}: StaffGridTimerProps) {
  if (drawTimeMs === null) {
    return null;
  }

  const deltaMs = prevDrawTimeMs !== null ? drawTimeMs - prevDrawTimeMs : null;

  return (
    <Paper
      pos="absolute"
      top={16}
      left={16}
      p="sm"
      style={{ pointerEvents: "none" }}
      withBorder
    >
      <NumberFormatter value={drawTimeMs / 1000} suffix="s" decimalScale={2} />
      {deltaMs !== null && (
        <>
          {" "}
          (
          <Text c={deltaMs < 0 ? "green" : "red"} span>
            <NumberFormatter
              value={deltaMs / 1000}
              prefix={deltaMs > 0 ? "+" : undefined}
              suffix="s"
              decimalScale={2}
            />
          </Text>
          )
        </>
      )}
    </Paper>
  );
}
