import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { initRegistry } from "./helpers/slot-registry"; // ← add karo
import { Header } from "./components/layout/header";
import { InputBar } from "./components/cli-input/input-bar";
import { ToastProvider } from "./providers/toast"
import { KeyboardLayerProvider } from "./providers/keyboard-layers";
import { DialogProvider } from "./providers/dialog";
import { ThemeProvider, useTheme } from "./providers/theme";

function ThemedRoot() {
  const { colors } = useTheme();
  return (
    <box
      backgroundColor={colors.background}
      width="100%"
      height="100%"
      gap={1.5}
    >
      <Header />
      <box>
        <InputBar onSubmit={() => { }} />
      </box>
    </box>
  )
}

function App() {
  return (
    <ThemeProvider>
      <KeyboardLayerProvider>
        <DialogProvider>
          <ToastProvider>
            <ThemedRoot />
          </ToastProvider>
        </DialogProvider>
      </KeyboardLayerProvider>
    </ThemeProvider>
  );
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
});
initRegistry(renderer);
createRoot(renderer).render(<App />);