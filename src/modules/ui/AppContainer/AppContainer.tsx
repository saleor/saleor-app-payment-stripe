import React from "react";
import { container } from "./AppContainer.css";

export const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className={container}>{children}</div>;
};
