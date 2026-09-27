import {
  getDatePart,
  getDatePartAsString,
  getPaddedDatePart,
} from "@graviola/edb-core-utils";
import { FormGroup, FormGroupProps, TextField } from "@mui/material";
import React, { useCallback } from "react";

export type AdbSpecialDateFormGroupProps = {
  data?: number;
  handleChange: (value: number) => void;
  disabled?: boolean;
  fullWidth?: boolean;
};
export const AdbSpecialDateFormGroup = ({
  data,
  handleChange,
  disabled,
  fullWidth,
  ...props
}: AdbSpecialDateFormGroupProps & FormGroupProps) => {
  const handleTextFieldChange = useCallback(
    (
      event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
      field: "day" | "month" | "year",
    ) => {
      const maxLength = field === "year" ? 4 : 2,
        maxValue = field === "year" ? 9999 : field === "month" ? 12 : 31,
        newValueNumber = Number(event.target.value);
      if (isNaN(newValueNumber) || newValueNumber > maxValue) return;
      const newValue = String(newValueNumber);
      if (newValue.length > maxLength) return;
      let strData;
      const paddedValue = String(newValueNumber).padStart(maxLength, "0");

      // check if the day is valid, if not, set it to the last day of the month (and handle leap years)
      let changeDay =
        field === "day" ? paddedValue : getPaddedDatePart(data, "day");
      const currentMonth = getDatePart(data, "month"),
        currentYear = getDatePart(data, "year");
      if (currentMonth > 0) {
        const lastDayOfMonth = new Date(
          currentYear ?? 4,
          currentMonth,
          0,
        ).getDate();
        if (Number(changeDay) > lastDayOfMonth) {
          changeDay = String(lastDayOfMonth).padStart(2, "0");
        }
      }
      if (field === "day")
        strData =
          getPaddedDatePart(data, "year") +
          getPaddedDatePart(data, "month") +
          changeDay;
      else if (field === "month")
        strData = getPaddedDatePart(data, "year") + paddedValue + changeDay;
      else strData = paddedValue + getPaddedDatePart(data, "month") + changeDay;
      handleChange(Number(strData));
    },
    [handleChange, data],
  );

  return (
    <FormGroup
      row={true}
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        width: fullWidth ? "100%" : "auto",
      }}
      {...props}
    >
      <TextField
        disabled={disabled}
        sx={{
          ...(fullWidth
            ? {
                width: "29%",
                minWidth: "4em",
              }
            : {
                width: "4em",
              }),
          "& .MuiOutlinedInput-root": {
            "& .MuiOutlinedInput-notchedOutline": {
              borderTopRightRadius: "0",
              borderBottomRightRadius: "0",
            },
          },
        }}
        label={"Tag"}
        value={getDatePartAsString(data ?? 0, "day")}
        onChange={(e) => handleTextFieldChange(e, "day")}
      />
      <TextField
        disabled={disabled}
        sx={{
          ...(fullWidth
            ? {
                width: "29%",
                minWidth: "4em",
              }
            : {
                width: "4em",
              }),
          "& .MuiOutlinedInput-root": {
            "& .MuiOutlinedInput-notchedOutline": {
              borderRadius: "0",
            },
          },
        }}
        onChange={(e) => handleTextFieldChange(e, "month")}
        label={"Monat"}
        value={getDatePartAsString(data ?? 0, "month")}
      />
      <TextField
        disabled={disabled}
        sx={{
          ...(fullWidth
            ? {
                width: "42%",
                minWidth: "6em",
              }
            : {
                width: "6em",
              }),
          "& .MuiOutlinedInput-root": {
            "& .MuiOutlinedInput-notchedOutline": {
              borderTopLeftRadius: "0",
              borderBottomLeftRadius: "0",
            },
          },
        }}
        onChange={(e) => handleTextFieldChange(e, "year")}
        label={"Jahr"}
        value={getDatePartAsString(data ?? 0, "year")}
      />
    </FormGroup>
  );
};
