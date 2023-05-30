import React, { type FC } from "react";
import { form as formStyles } from "./Form.css";

export const Form: FC<React.HTMLProps<HTMLFormElement>> = (props) => {
  return <form className={formStyles} {...props} method="post" />;
};
