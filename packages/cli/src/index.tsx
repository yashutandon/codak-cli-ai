import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { initRegistry } from "./helpers/slot-registry"; // ← add karo
import { Header } from "./components/layout/header";
import { InputBar } from "./components/cli-input/input-bar";
import {ToastProvider} from "./providers/toast"
import { KeyboardLayerProvider } from "./providers/keyboard-layers";
import { DialogProvider } from "./providers/dialog";

function App() {
  return (
    <KeyboardLayerProvider>
      <DialogProvider>
    <ToastProvider>
      <box
        backgroundColor="#18181c"
      width="100%"
      height="100%"
      gap={1.5}
      >
        <Header/>
        <box>
          <InputBar onSubmit={()=>{}}/>
        </box>
    </box>
    </ToastProvider>
    </DialogProvider>
    </KeyboardLayerProvider>
  );
}

const renderer = await createCliRenderer({
  targetFps:60,
  exitOnCtrlC: false,
});
initRegistry(renderer);
createRoot(renderer).render(<App />);