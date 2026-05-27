import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { initRegistry } from "./helpers/slot-registry"; // ← add karo
import { Header } from "./components/layout/header";
import { InputBar } from "./components/cli-input/input-bar";

function App() {
  return (
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
  );
}

const renderer = await createCliRenderer();
initRegistry(renderer);
createRoot(renderer).render(<App />);