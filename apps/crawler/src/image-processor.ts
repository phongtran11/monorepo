import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

import sharp from 'sharp';

/**
 * Download a remote image URL to the raw directory and process it with Sharp.
 * Returns the local path to the processed WebP file, or null on failure.
 */
export async function processImage(
  imageUrl: string,
  rawDir: string,
  processedDir: string,
): Promise<string | null> {
  if (!imageUrl) return null;

  // Validate URL to prevent SSRF — only allow http/https
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    console.warn(`[image] Invalid URL skipped: ${imageUrl}`);
    return null;
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    console.warn(`[image] Non-http URL skipped: ${imageUrl}`);
    return null;
  }

  // Derive a stable filename from the URL hash
  const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
  const rawExt = path.extname(parsedUrl.pathname) || '.jpg';
  const rawFilename = `${hash}${rawExt}`;
  const rawPath = path.join(rawDir, rawFilename);
  const processedFilename = `${hash}.webp`;

  // Resolve output path and guard against path traversal
  const resolvedProcessedDir = path.resolve(processedDir);
  const processedPath = path.join(resolvedProcessedDir, processedFilename);
  if (!processedPath.startsWith(resolvedProcessedDir + path.sep)) {
    console.warn(`[image] Path traversal attempt blocked for: ${imageUrl}`);
    return null;
  }

  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(resolvedProcessedDir, { recursive: true });

  // Download raw image if not already cached
  if (!fs.existsSync(rawPath)) {
    try {
      await downloadFile(imageUrl, rawPath);
    } catch (err) {
      console.warn(`[image] Download failed for ${imageUrl}: ${(err as Error).message}`);
      return null;
    }
  }

  // Process with Sharp
  try {
    await sharp(rawPath)
      .resize(800, 800, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 85 })
      .toFile(processedPath);
  } catch (err) {
    console.warn(`[image] Sharp processing failed for ${rawPath}: ${(err as Error).message}`);
    return null;
  }

  return processedPath;
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          const redirectUrl = response.headers.location;
          if (!redirectUrl) return reject(new Error('Redirect with no Location header'));
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        }
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      })
      .on('error', (err) => {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}
