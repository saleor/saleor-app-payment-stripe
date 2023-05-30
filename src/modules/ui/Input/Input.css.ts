import { vars } from "@saleor/macaw-ui/next";
import { style } from "@vanilla-extract/css";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing[4],
});

export const label = style({
  fontFamily: "monospace",
  fontSize: vars.fontSize.headingSmall,
});

export const input = style({
  appearance: "none",
  position: "relative",
  height: "24px",
  width: "100%",
  outline: "transparent solid 2px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: vars.borderRadius[2],
  ":disabled": {
    backgroundColor: vars.colors.background.subdued,
  },
});
