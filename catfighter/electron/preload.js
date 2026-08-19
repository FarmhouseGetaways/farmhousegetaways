/* Nothing is exposed to the page. The game is entirely self-contained and has
   no reason to touch the filesystem, the network or the operating system —
   keeping it that way is the whole point of contextIsolation. If Steam
   achievements are added later, this is the file that would bridge them. */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('catfighter', {
  platform: process.platform,
  version: process.env.npm_package_version || '0.1.0',
  isDesktop: true
});
