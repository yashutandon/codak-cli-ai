import type { ReactNode } from "react";
import { useTheme } from "../../providers/theme";
import { InputBar } from "../cli-input/input-bar";
import { Header } from "./header";

interface Props{
    children:ReactNode
}
export function ThemedRoot({children}:Props) {
  const { colors } = useTheme();
  return (
    <box
      backgroundColor={colors.background}
      width="100%"
      height="100%"
      gap={1.5}
    >
      {children}
    </box>
  )
}