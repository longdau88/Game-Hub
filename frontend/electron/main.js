const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let server;
function startServer(dir, port) {
  server = http.createServer((req, res) => {
    let filePath = path.join(dir, req.url.split('?')[0]);
    if (filePath === dir || filePath === path.join(dir, '/')) {
      filePath = path.join(dir, 'index.html');
    }
    // Very basic static file server fallback
    if (!fs.existsSync(filePath)) {
      if (req.url.includes('__next.') && req.url.includes('.txt')) {
        filePath = path.join(dir, 'index.txt');
      } else {
        console.log(`[HTTP 404] ${req.url} -> ${filePath}`);
        filePath = path.join(dir, req.url.split('?')[0] + '.html');
        if (!fs.existsSync(filePath)) {
          filePath = path.join(dir, 'index.html');
        }
      }
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'text/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.ico') contentType = 'image/x-icon';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (ext === '.woff') contentType = 'font/woff';
    else if (ext === '.woff2') contentType = 'font/woff2';
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }).listen(port, '127.0.0.1');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    backgroundColor: '#0a0a0a',
    show: false,
  });

  const port = 30000 + Math.floor(Math.random() * 10000);
  startServer(path.join(__dirname, '../out'), port);
  win.loadURL(`http://127.0.0.1:${port}`);

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Log browser console to terminal for debugging
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Browser Console] ${message} (${sourceId}:${line})`);
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      window.onerror = function(message, source, lineno, colno, error) {
        console.log("GLOBAL_ERROR: " + message + " at " + source + ":" + lineno);
      };
      window.onunhandledrejection = function(event) {
        console.log("UNHANDLED_PROMISE: " + (event.reason ? event.reason.stack || event.reason : ""));
      };
      setTimeout(() => {
        console.log("BODY_TEXT: " + document.body.innerText.substring(0, 500));
        console.log("STYLESHEETS: " + document.styleSheets.length);
      }, 3000);
    `);
  });

  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});
