import { contextBridge, ipcRenderer } from "electron";

const api = {
  getVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  }),
  checkForUpdate: () => ipcRenderer.invoke("check-for-update"),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Preload context fallback
    console.error(error);
  }
} else {
  // @ts-expect-error - fallback for non-isolated contexts
  window.api = api;
}
