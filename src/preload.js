
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appInfo", {
  name: "Browser Automation",
  version: "1.0.0",
  platform: "Windows",

  checkProxy: (proxy) => {
    return ipcRenderer.invoke("proxy:check", proxy);
  }
});
