// scripts/check-links.mjs
// Uses headless Chromium (Playwright) for web pages and plain HTTP for file assets.
// First-time setup: npx playwright install chromium

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import fs from 'node:fs';

const CONCURRENCY = 3;
const TIMEOUT_MS = 20_000;
const FETCH_TIMEOUT_MS = 15_000;
const RESOURCES_PATH = 'src/data/resources.json';

const BROKEN_STATUSES = new Set([404, 410]);
const ERROR_PATH_RE = /\/(404|not[-_]found|page[-_]not[-_]found)\b/i;

// CDN / bot-protection signals in the page title or h1.
// If detected, the page exists but is behind a firewall — treat as valid.
const BOT_PROTECTION_RE =
  /\b(cloudflare|incapsula|ddos.?guard|just a moment\.{3}|captcha|verify (you are|your browser)|human verification)\b/i;

// Patterns matched against rendered title + h1 (after JS execution).
// Indicates genuine "this content does not exist" rather than a bot block.
const NOT_FOUND_PATTERNS = [
  /\b(404|not found|page not found)\b/i,
  /page (doesn['']t|does not) exist/i,
  /we (couldn['']t|can['']t) find (that|this|the)? ?(page|content|resource)/i,
  /this page (no longer exists|has been removed)/i,
  /the page you['']?re? looking for/i,
  /content is no longer available/i,
  /page has (been removed|moved|expired)/i,
  /oops[!,]?\s*(something|this|that)/i,
  /you (can['']t|cannot) access this/i,
];

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-GB,en;q=0.9',
};


const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));

// --- Plain HTTP check ---
// Used for asset URLs (PDFs, docs, etc.) where JS rendering is unnecessary,
// and as a fallback when Playwright's HTTP/2 stack is rejected by the server.
const httpCheck = async (url) => {
  const doFetch = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: FETCH_HEADERS,
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  // Returns true for AbortError / timeout — we can't determine validity, so keep the link.
  const isTimeout = (err) =>
    err?.type === 'aborted' ||
    err?.name === 'AbortError' ||
    (err?.message ?? '').toLowerCase().includes('aborted');

  const evalResponse = (res) => {
    if (BROKEN_STATUSES.has(res.status)) {
      return { ok: false, status: res.status };
    }
    // 405 = HEAD not supported — caller should retry with GET
    if (res.status === 405) return null;

    return { ok: true, status: res.status };
  };

  try {
    const headRes = await doFetch('HEAD');
    const result = evalResponse(headRes);
    // null means 405 or ambiguous — fall through to GET
    if (result !== null) return result;
  } catch (err) {
    if (isTimeout(err)) {
      // Can't reach the server (timeout / bot-block) — can't determine, keep the link
      return { ok: true, status: null };
    }
    // Other error — fall through to GET
  }

  // GET fallback: used when HEAD is unsupported (405) or threw a non-timeout error
  try {
    const getRes = await doFetch('GET');
    const result = evalResponse(getRes);
    return result ?? { ok: true, status: getRes.status };
  } catch (err) {
    if (isTimeout(err)) {
      return { ok: true, status: null };
    }
    return { ok: false, status: null, error: err.message };
  }
};

// --- Playwright check ---
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
  ignoreHTTPSErrors: true,
});

const checkUrl = async (url) => {
  const page = await context.newPage();
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_MS,
    });

    const status = response?.status() ?? null;
    const finalUrl = page.url();

    if (status && BROKEN_STATUSES.has(status)) {
      return { ok: false, status };
    }

    // Redirected to an error-path URL (e.g. /404, /not-found)
    try {
      if (ERROR_PATH_RE.test(new URL(finalUrl).pathname)) {
        return { ok: false, status, reason: `Redirected to error page: ${finalUrl}` };
      }
    } catch { /* ignore */ }

    // Redirected to a completely different domain
    try {
      const origHost = new URL(url).hostname.replace(/^www\./, '');
      const finalHost = new URL(finalUrl).hostname.replace(/^www\./, '');
      if (origHost !== finalHost) {
        return { ok: false, status, reason: `Redirected off-domain to: ${finalUrl}` };
      }
    } catch { /* ignore */ }

    // Deep URL silently redirected to site root (common for deleted content)
    try {
      const origDepth = new URL(url).pathname.replace(/\/$/, '').split('/').length;
      const finalPath = new URL(finalUrl).pathname;
      if (origDepth > 2 && (finalPath === '/' || finalPath === '')) {
        return { ok: false, status, reason: `Redirected to homepage: ${finalUrl}` };
      }
    } catch { /* ignore */ }

    // Check the rendered title + h1 after JavaScript has executed
    const title = await page.title().catch(() => '');
    const h1 = await page.$eval('h1', (el) => el.innerText ?? el.textContent ?? '').catch(() => '');
    const checkText = `${title} | ${h1}`;

    // CDN / bot-protection: page exists but is behind a firewall — treat as valid
    if (BOT_PROTECTION_RE.test(checkText)) {
      return { ok: true, status };
    }

    const matchedPattern = NOT_FOUND_PATTERNS.find((re) => re.test(checkText));
    if (matchedPattern) {
      return {
        ok: false,
        status,
        reason: `Page indicates not found — title: "${title}", h1: "${h1.slice(0, 80)}"`,
      };
    }

    return { ok: true, status };
  } catch (err) {
    const msg = err.message ?? '';

    if (msg.includes('Download is starting')) {
      // Chromium triggered a file download — the URL serves a valid file
      return { ok: true, status: null };
    }

    if (msg.includes('ERR_HTTP2_PROTOCOL_ERROR') || msg.includes('net::ERR_HTTP2')) {
      // Server rejected Playwright's HTTP/2 stack — fall back to plain HTTP
      return httpCheck(url);
    }

    return { ok: false, status: null, error: msg };
  } finally {
    await page.close();
  }
};

// Process items in batches to limit concurrency
const checkWithConcurrency = async (items, fn, concurrency) => {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
};

console.log(`🔍 Checking ${resources.length} resource links (concurrency: ${CONCURRENCY})...`);

const checked = await checkWithConcurrency(
  resources,
  async (resource) => {
    const result = await checkUrl(resource.url);
    const icon = result.ok ? '✅' : '❌';
    const statusLabel = result.status != null ? String(result.status) : result.error?.slice(0, 60) ?? 'ERR';
    const detail = result.reason ? ` — ${result.reason}` : '';
    console.log(`  ${icon} [${statusLabel}] ${resource.url}${detail}`);
    return { resource, result };
  },
  CONCURRENCY,
);

await browser.close();

const working = checked.filter((c) => c.result.ok).map((c) => c.resource);
const broken = checked
  .filter((c) => !c.result.ok)
  .map((c) => ({
    id: c.resource.id,
    title: c.resource.title,
    url: c.resource.url,
    status: c.result.status,
    reason: c.result.reason ?? null,
    error: c.result.error ?? null,
  }));

fs.writeFileSync(RESOURCES_PATH, JSON.stringify(working, null, 2));
console.log(`\n✅ Kept ${working.length} active resources, removed ${broken.length} broken link(s).`);

if (broken.length > 0) {
  fs.writeFileSync('broken-links.json', JSON.stringify(broken, null, 2));

  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvRows = [
    ['id', 'title', 'url', 'status', 'reason', 'error'].map(escape).join(','),
    ...broken.map((b) => [b.id, b.title, b.url, b.status, b.reason, b.error].map(escape).join(',')),
  ];
  fs.writeFileSync('broken-links.csv', csvRows.join('\n'));

  console.log(`❌ Exported ${broken.length} broken link(s) to broken-links.json and broken-links.csv`);
}
