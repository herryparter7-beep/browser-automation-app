
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { request } = require("playwright");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#f5f8f6",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "../index.html"));
}

ipcMain.handle("proxy:check", async (_event, rawProxy) => {
  let context;

  try {
    if (typeof rawProxy !== "string" || rawProxy.length > 2048) {
      throw new Error("Invalid proxy entry");
    }

    let value = rawProxy.trim();

    if (!value.includes("://")) {
      value = "http://" + value;
    }

    const parsed = new URL(value);

    if (!["http:", "https:", "socks5:"].includes(parsed.protocol)) {
      throw new Error("Unsupported proxy protocol");
    }

    if (!parsed.hostname || !parsed.port) {
      throw new Error("Proxy host and port are required");
    }

    const proxy = {
      server: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`
    };

    if (parsed.username) {
      proxy.username = decodeURIComponent(parsed.username);
    }

    if (parsed.password) {
      proxy.password = decodeURIComponent(parsed.password);
    }

    const started = Date.now();

    context = await request.newContext({
      proxy,
      timeout: 12000
    });

    const response = await context.get(
      "https://api.ipify.org?format=json"
    );

    if (!response.ok()) {
      throw new Error("Proxy test endpoint returned an error");
    }

    const data = await response.json();

    return {
      success: true,
      ip: data.ip,
      latency: Date.now() - started,
      message: "Connection successful"
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || "Connection failed"
    };

  } finally {
    if (context) await context.dispose();
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
