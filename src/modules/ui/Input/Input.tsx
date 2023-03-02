import { Box, Text } from "@saleor/macaw-ui/next";
import { useEffect, useState } from "react";
import {
  type FieldPath,
  type FieldValues,
  useController,
  type UseControllerProps,
} from "react-hook-form";
import { OBFUSCATION_DOTS } from "../../app-configuration/app-configuration";
import { input, label as labelStyles, wrapper } from "./Input.css";

interface InputProps {
  label: string;
  autoClearEncrypted?: boolean;
}

export const Input = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label: labelText,
  autoClearEncrypted,
  ...props
}: InputProps & UseControllerProps<TFieldValues, TName> & React.HTMLProps<HTMLInputElement>) => {
  const { field, fieldState } = useController<TFieldValues, TName>(props);

  const [uiValue, setUIValue] = useState<string>(field.value);

  useEffect(() => {
    setUIValue(field.value);
  }, [field.value]);

  return (
    <Box display="flex" flexDirection="column" gap={2} flexGrow="1">
      <label className={wrapper}>
        <span className={labelStyles}>{labelText}</span>
        <input
          {...field}
          {...props}
          value={uiValue}
          onFocus={(e) => {
            if (
              e.target.value.includes(OBFUSCATION_DOTS) &&
              !fieldState.isDirty &&
              autoClearEncrypted
            ) {
              setUIValue("");
            }
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            if (e.target.value === "" && autoClearEncrypted) {
              setUIValue(field.value);
            }
            field.onBlur();
            props.onBlur?.(e);
          }}
          className={input}
        />
      </label>
      {fieldState.error && <Text color="iconCriticalDefault">{fieldState.error.message}</Text>}
    </Box>
  );
};
