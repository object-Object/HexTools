import { NumberInput, type NumberInputProps } from "@mantine/core";
import { useEffect, useState } from "react";

export interface ControlledNumberInputProps extends Omit<
  NumberInputProps,
  "value" | "onChange"
> {
  value: number;
  onChange: (value: number) => unknown;
}

export default function ControlledNumberInput({
  value,
  onChange,
  ...restProps
}: ControlledNumberInputProps) {
  const { min, max } = restProps;

  const [stringValue, setStringValue] = useState<string | number>(value);

  useEffect(() => {
    setStringValue(value);
  }, [value]);

  return (
    <NumberInput
      value={stringValue}
      onChange={(newValue) => {
        setStringValue(newValue);
        if (
          typeof newValue === "number"
          && (min == null || newValue >= min)
          && (max == null || newValue <= max)
        ) {
          onChange(newValue);
        }
      }}
      {...restProps}
    />
  );
}
