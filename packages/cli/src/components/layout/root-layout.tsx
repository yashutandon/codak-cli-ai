import { Outlet } from "react-router";
import { ToastProvider } from "../../providers/toast";
import { DialogProvider } from "../../providers/dialog";
import { KeyboardLayerProvider } from "../../providers/keyboard-layers";
import { ThemeProvider } from "../../providers/theme";
import { ThemedRoot } from "./theme-root";


export function RootLayout() {
    return (
        <ThemeProvider>
            <KeyboardLayerProvider>
                <DialogProvider>
                    <ToastProvider>
                        <ThemedRoot >
                            <Outlet/>
                        </ThemedRoot>
                    </ToastProvider>
                </DialogProvider>
            </KeyboardLayerProvider>
        </ThemeProvider>
    )
}