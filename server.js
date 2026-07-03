const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { compile } = require('./compile');

const PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Get Data
  if (pathname === '/api/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    const data = fs.readFileSync(path.join(BASE_DIR, 'data.json'), 'utf8');
    res.end(data);
    return;
  }

  // API Save Data
  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(path.join(BASE_DIR, 'data.json'), JSON.stringify(parsed, null, 2), 'utf8');
        
        // Recompile HTML
        compile();
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Đã lưu dữ liệu và biên dịch thành công!' }));
      } catch (err) {
        console.error('Error saving data:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Lỗi máy chủ khi lưu dữ liệu.' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(BASE_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Safe directory check to prevent directory traversal
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try adding .html extension if missing
      const filePathWithHtml = filePath + '.html';
      fs.stat(filePathWithHtml, (errHtml, statsHtml) => {
        if (!errHtml && statsHtml.isFile()) {
          serveFile(filePathWithHtml, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>404 Not Found</h1><p>File không tồn tại trên hệ thống chạy local.</p>');
        }
      });
    } else {
      serveFile(filePath, res);
    }
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  res.writeHead(200, { 'Content-Type': contentType });
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
}

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/admin.html`;
  console.log(`\n============================================================`);
  console.log(`🎓 ANH NGỮ GIA VIỆT - MÁY CHỦ LOCAL ĐANG HOẠT ĐỘNG`);
  console.log(`------------------------------------------------------------`);
  console.log(`👉 Trang quản trị: ${url}`);
  console.log(`👉 Xem Landing Page: http://localhost:${PORT}/index.html`);
  console.log(`\nBấm Ctrl+C để dừng máy chủ.`);
  console.log(`============================================================\n`);
  
  // Auto open browser on macOS
  exec(`open "${url}"`, (err) => {
    if (err) {
      console.log(`Không thể tự động mở trình duyệt. Hãy mở liên kết này theo cách thủ công: ${url}`);
    }
  });
});
