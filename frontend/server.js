/**
 * FRONTEND STATIC DEV SERVER & API PROXY
 * Chạy giao diện Web Frontend và kết nối tới Spring Boot Backend
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // 1. Tự động chuyển tiếp (Proxy) nếu có request gọi /api/ sang Spring Boot
  if (req.url.startsWith('/api/')) {
    const backendTarget = new URL(BACKEND_URL);
    const options = {
      hostname: backendTarget.hostname,
      port: backendTarget.port || 8080,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${backendTarget.hostname}:${backendTarget.port || 8080}`
      }
    };

    const transport = backendTarget.protocol === 'https:' ? https : http;
    const proxyReq = transport.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Không thể kết nối tới Backend Spring Boot tại ' + BACKEND_URL + '. Hãy đảm bảo Spring Boot đang chạy!'
      }));
    });
    proxyReq.setTimeout(15000, () => proxyReq.destroy(new Error('Backend request timed out')));

    req.pipe(proxyReq, { end: true });
    return;
  }

  // 2. Phục vụ tài nguyên tĩnh của Frontend (index.html, css, js, images)
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/' || cleanUrl === '') {
    cleanUrl = '/index.html';
  }

  const filePath = path.join(__dirname, cleanUrl);

  // Ngăn chặn Path Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback về index.html cho SPA Routing
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err3, content) => {
      if (err3) {
        res.writeHead(500);
        res.end('Error loading file');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🌐 FRONTEND WEB SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
  console.log(`🔗 KẾT NỐI TỚI BACKEND SPRING BOOT:  ${BACKEND_URL}`);
  console.log(`=============================================================\n`);
});
