import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./components/Canvas";
import { AppThemeProvider } from "./styles/Theme";

function App() {
  return (
    <AppThemeProvider>
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </AppThemeProvider>
  );
}

export default App;
