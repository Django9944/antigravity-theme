import { createReadStream, existsSync, lstatSync, realpathSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, posix, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function parsePort(raw: string | undefined): number {
  if (raw === undefined) return 4173;
  if (!/^\d+$/.test(raw.trim())) {
    throw new Error(`Invalid PORT "${raw}"; expected integer between 1 and 65535.`);
  }
  const port = Number.parseInt(raw.trim(), 10);
  if (port < 1 || port > 65535) {
    throw new Error(`Out-of-range PORT ${port}; expected between 1 and 65535.`);
  }
  return port;
}

const PORT = parsePort(process.env.PORT);

const ALLOWED_ROOTS = new Map<string, string>([
  ['preview', realpathSync(resolve(ROOT_DIR, 'preview'))],
  ['dist', realpathSync(resolve(ROOT_DIR, 'dist'))],
]);

function sendText(
  res: import('node:http').ServerResponse,
  status: number,
  body: string,
  extraHeaders: Record<string, string> = {},
): void {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(body);
}

const server = createServer((req, res) => {
  const method = req.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let decodedPath: string;
  try {
    const rawPath = (req.url ?? '/').split('?')[0] ?? '/';
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    sendText(res, 400, 'Bad Request: malformed URI');
    return;
  }

  if (decodedPath.includes('\0')) {
    sendText(res, 400, 'Bad Request: null byte in path');
    return;
  }

  if (decodedPath === '/' || decodedPath === '/preview') {
    res.writeHead(302, {
      Location: '/preview/',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end();
    return;
  }

  const normalizedPosix = posix.normalize(decodedPath);
  const segments = normalizedPosix.replace(/^\/+/, '').split('/');
  if (segments.some((seg) => seg === '..' || seg.startsWith('.'))) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  const rootPrefix = segments[0];
  if (!rootPrefix || !ALLOWED_ROOTS.has(rootPrefix)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  const allowedRoot = ALLOWED_ROOTS.get(rootPrefix)!;
  const subSegments = segments.slice(1);
  let candidate = resolve(allowedRoot, ...subSegments);

  try {
    if (!existsSync(candidate)) {
      sendText(res, 404, 'Not Found');
      return;
    }

    const stat = lstatSync(candidate);
    if (stat.isSymbolicLink()) {
      sendText(res, 403, 'Forbidden');
      return;
    }

    if (stat.isDirectory()) {
      if (!decodedPath.endsWith('/')) {
        res.writeHead(302, {
          Location: `${decodedPath}/`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        });
        res.end();
        return;
      }
      candidate = resolve(candidate, 'index.html');
      if (!existsSync(candidate) || lstatSync(candidate).isSymbolicLink()) {
        sendText(res, 404, 'Not Found');
        return;
      }
    }

    const realTarget = realpathSync(candidate);
    if (realTarget !== allowedRoot && !realTarget.startsWith(`${allowedRoot}${sep}`)) {
      sendText(res, 403, 'Forbidden');
      return;
    }

    const finalStat = lstatSync(realTarget);
    if (!finalStat.isFile()) {
      sendText(res, 404, 'Not Found');
      return;
    }

    const mime = MIME_TYPES[extname(realTarget).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': String(finalStat.size),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const stream = createReadStream(realTarget);
    stream.on('error', () => {
      if (!res.headersSent) {
        sendText(res, 500, 'Internal Server Error');
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  } catch {
    if (!res.headersSent) {
      sendText(res, 500, 'Internal Server Error');
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Antigravity Theme preview running at http://127.0.0.1:${PORT}/preview/`);
});
