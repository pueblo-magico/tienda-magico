"use client";

import { useState } from "react";
import {
  Input,
  type InputProps,
} from "@pueblo-magico/react-ui";
import { formatArsPesos } from "@/lib/money/ars-input";

export type ArsInputProps = Omit<
  InputProps,
  "defaultValue" | "inputMode" | "onChange" | "type" | "value"
> & {
  defaultValue?: string;
  onChange?: (value: string) => void;
  value?: string;
};

export function ArsInput({
  defaultValue = "",
  onChange,
  value,
  ...props
}: ArsInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    formatArsPesos(defaultValue),
  );
  const displayedValue =
    value === undefined ? uncontrolledValue : formatArsPesos(value);

  return (
    <Input
      {...props}
      inputMode="numeric"
      type="text"
      value={displayedValue}
      onChange={(nextValue) => {
        const formattedValue = formatArsPesos(nextValue);
        if (value === undefined) setUncontrolledValue(formattedValue);
        onChange?.(formattedValue);
      }}
    />
  );
}
