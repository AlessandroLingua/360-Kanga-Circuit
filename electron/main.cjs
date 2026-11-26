// Desktop shell for Windows and macOS. Loads the built web app from dist/.
const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    backgroundColor: '#101a17',
    title: 'Kanga Circuit 360',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  // open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('#tv')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  // allow wake lock / fullscreen; deny everything else
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(['wakeLock', 'fullscreen'].includes(perm)));
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
