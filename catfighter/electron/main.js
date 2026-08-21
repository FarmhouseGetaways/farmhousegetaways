/* ==========================================================================
   Super Cat Fighter 6 — Electron shell

   The game is plain HTML and classic <script> tags on purpose: it runs from
   file:// with no bundler, no dev server and no module loader, which is what
   lets the same folder work as a website, as a double-clicked index.html and
   as this desktop app without a single line changing.
   ========================================================================== */
const { app, BrowserWindow, Menu, globalShortcut, screen } = require('electron');
const path = require('path');

/* No `disable-gpu-vsync`, and no `disable-frame-rate-limit`.

   Both were here, on the theory that a fighting game must not be held back by
   the compositor. They did the opposite. With the frame limit off, Chromium
   runs requestAnimationFrame as fast as the machine will let it — hundreds of
   times a second — and redraws the whole screen every time. On a large window
   that is tens of millions of pixels a frame with nothing to pace it, the
   compositor backs up, and what you actually see is a game running at about
   one frame a second with the input arriving in clumps.

   The simulation is a fixed 60Hz with its own accumulator (see main.js), so
   it does not need or want an uncapped display. Vsync is what it wants. */

let win = null;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.workAreaSize;

  /* 384 x 224 is the arcade resolution. Open at the largest whole multiple
     that fits comfortably on this monitor, so the art lands on pixel edges. */
  const mult = Math.max(2, Math.min(Math.floor(sw / 384), Math.floor(sh / 224)) - 1);
  const w = 384 * mult;
  const h = 224 * mult;

  win = new BrowserWindow({
    width: w,
    height: h,
    minWidth: 384 * 2,
    minHeight: 224 * 2,
    backgroundColor: '#07060a',
    title: 'Super Cat Fighter 6',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('F11', () => {
    if (win) win.setFullScreen(!win.isFullScreen());
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (win) win.webContents.toggleDevTools();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => globalShortcut.unregisterAll());
