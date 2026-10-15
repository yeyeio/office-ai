const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CERTS_DIR = path.join(__dirname, 'certs');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon'
};

function requestHandler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let rawUrl = req.url === '/' ? '/taskpane.html' : req.url.split('?')[0];
  let subPath = path.normalize(rawUrl).replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');

  // Strictly disallow access to sensitive directories, private keys, and config files
  const forbiddenPatterns = [/certs/i, /^\.git/i, /^\.kilo/i, /package.*\.json$/i, /server\.js$/i, /\.env/i];
  if (forbiddenPatterns.some(pat => pat.test(subPath))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Determine allowed source: dist first, then public assets/manifest.xml only
  const distDir = path.join(__dirname, 'dist');
  let filePath = path.join(distDir, subPath);

  // If not found in dist, check if it's an explicitly allowed root asset (manifest.xml, assets/*)
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    if (subPath === 'manifest.xml' || subPath.startsWith('assets' + path.sep) || subPath.startsWith('assets/')) {
      filePath = path.join(__dirname, subPath);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + req.url);
      return;
    }
  }

  // Directory traversal validation
  const relFromRoot = path.relative(__dirname, filePath);
  if (relFromRoot.startsWith('..') || path.isAbsolute(relFromRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + req.url);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const keyPath = path.join(CERTS_DIR, 'key.pem');
const certPath = path.join(CERTS_DIR, 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(options, requestHandler).listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Office AI Add-in Server Running!`);
    console.log(`🔗 HTTPS URL: https://localhost:${PORT}/taskpane.html`);
    console.log(`📄 Manifest:  https://localhost:${PORT}/manifest.xml`);
    console.log(`==================================================\n`);
  });
} else {
  http.createServer(requestHandler).listen(PORT, '0.0.0.0', () => {
    console.log(`[HTTP] Server running on http://localhost:${PORT}/taskpane.html`);
  });
}
