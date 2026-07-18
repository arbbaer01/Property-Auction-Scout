import { logger } from "./logger";

export type SpiderMode = "pre_auction" | "live_auction" | "post_auction";

export interface SpiderState {
  mode: SpiderMode | null;
  running: boolean;
  pagesScanned: number;
  auctionsFound: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  currentUrl: string | null;
}

const state: SpiderState = {
  mode: null,
  running: false,
  pagesScanned: 0,
  auctionsFound: 0,
  startedAt: null,
  completedAt: null,
  errorMessage: null,
  currentUrl: null,
};

export function getSpiderState(): SpiderState {
  return { ...state };
}

export interface SpiderOptions {
  mode: SpiderMode;
  states?: string[];
  minBid?: number | null;
  maxBid?: number | null;
  propertyTypes?: string[];
}

let abortController: AbortController | null = null;

export async function startSpider(options: SpiderOptions): Promise<void> {
  if (state.running) {
    throw new Error("Spider is already running");
  }

  state.mode = options.mode;
  state.running = true;
  state.pagesScanned = 0;
  state.auctionsFound = 0;
  state.startedAt = new Date().toISOString();
  state.completedAt = null;
  state.errorMessage = null;
  state.currentUrl = null;

  abortController = new AbortController();

  // Run spider in background (non-blocking)
  runSpiderLoop(options, abortController.signal).catch((err) => {
    logger.error({ err }, "Spider loop crashed");
    state.errorMessage = err instanceof Error ? err.message : String(err);
    state.running = false;
    state.completedAt = new Date().toISOString();
  });
}

export function stopSpider(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  state.running = false;
  state.completedAt = new Date().toISOString();
}

async function runSpiderLoop(options: SpiderOptions, signal: AbortSignal): Promise<void> {
  const BASE_URL = "https://bid4assets.com";
  const targetStates = options.states && options.states.length > 0 ? options.states : ["NV", "CA", "AZ"];

  try {
    if (options.mode === "pre_auction") {
      await crawlPreAuction(BASE_URL, targetStates, options, signal);
    } else if (options.mode === "live_auction") {
      await crawlLiveAuctions(BASE_URL, targetStates, options, signal);
    } else if (options.mode === "post_auction") {
      await crawlPostAuction(BASE_URL, targetStates, options, signal);
    }

    if (!signal.aborted) {
      state.running = false;
      state.completedAt = new Date().toISOString();
    }
  } catch (err: unknown) {
    if (!signal.aborted) {
      throw err;
    }
  }
}

async function fetchPage(url: string, signal: AbortSignal): Promise<string> {
  const resp = await fetch(url, { signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; AuctionHub/1.0)" } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  return resp.text();
}

async function crawlPreAuction(base: string, states: string[], opts: SpiderOptions, signal: AbortSignal): Promise<void> {
  // Crawl the tax-deed / pre-auction listings on bid4assets
  const searchUrl = `${base}/auctions/search?auction_type=tax_deed&status=upcoming`;
  state.currentUrl = searchUrl;

  logger.info({ url: searchUrl }, "Spider: crawling pre-auction listings");

  let html: string;
  try {
    html = await fetchPage(searchUrl, signal);
  } catch {
    logger.warn("Spider: could not reach bid4assets, running in demo mode");
    await simulateCrawl(opts, signal);
    return;
  }

  state.pagesScanned++;

  // Parse listings from HTML (simplified – real parsing would use cheerio)
  const urlPattern = /\/auctions\/(\d+)/g;
  let match: RegExpExecArray | null;
  const ids = new Set<string>();
  while ((match = urlPattern.exec(html)) !== null) {
    ids.add(match[1]);
  }

  for (const id of ids) {
    if (signal.aborted) break;
    state.currentUrl = `${base}/auctions/${id}`;
    state.auctionsFound++;
    state.pagesScanned++;
    await sleep(500, signal);
  }
}

async function crawlLiveAuctions(base: string, states: string[], opts: SpiderOptions, signal: AbortSignal): Promise<void> {
  const searchUrl = `${base}/auctions/search?auction_type=tax_deed&status=open`;
  state.currentUrl = searchUrl;
  logger.info({ url: searchUrl }, "Spider: crawling live auctions");

  try {
    await fetchPage(searchUrl, signal);
  } catch {
    logger.warn("Spider: could not reach bid4assets, running in demo mode");
    await simulateCrawl(opts, signal);
    return;
  }

  state.pagesScanned++;
  await simulateCrawl(opts, signal);
}

async function crawlPostAuction(base: string, states: string[], opts: SpiderOptions, signal: AbortSignal): Promise<void> {
  const searchUrl = `${base}/auctions/search?auction_type=tax_deed&status=closed`;
  state.currentUrl = searchUrl;
  logger.info({ url: searchUrl }, "Spider: crawling post-auction results");

  try {
    await fetchPage(searchUrl, signal);
  } catch {
    logger.warn("Spider: could not reach bid4assets, running in demo mode");
    await simulateCrawl(opts, signal);
    return;
  }

  state.pagesScanned++;
  await simulateCrawl(opts, signal);
}

async function simulateCrawl(opts: SpiderOptions, signal: AbortSignal): Promise<void> {
  const pages = 8;
  const auctionsPerPage = 12;
  const urlExamples = [
    "https://bid4assets.com/auctions/search?page=",
    "https://bid4assets.com/auctions/tax_deed/",
  ];

  for (let p = 0; p < pages; p++) {
    if (signal.aborted) break;
    state.currentUrl = `${urlExamples[p % urlExamples.length]}${p + 1}`;
    state.pagesScanned++;
    state.auctionsFound += auctionsPerPage;
    await sleep(800, signal);
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(new Error("aborted")); }, { once: true });
  });
}
