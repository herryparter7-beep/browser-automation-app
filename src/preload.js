const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("appInfo", {
  name: "Browser Automation",
  version: "1.0.0",
  platform: "Windows"
});
