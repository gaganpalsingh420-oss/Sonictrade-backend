// services/stockFetcher.js
const axios = require("axios");
const cron = require("node-cron");

/**
 * This module:
 *  - exposes getCachedData() to return last snapshot
 *  - starts a cron job that refreshes prices every 2 hours
 *
 * NOTE: It uses FINNHUB_API_KEY if present; otherwise tries Yahoo query endpoint.
 */

const SYMBOLS = [
  "TATAMOTORS.NS",
  "MRF.NS",
  "ADANIGREEN.NS",
  "WIPRO.NS",
  "AFFLE.NS",
  "HDFCBANK.NS",
  "RELIANCE.NS"
];

let cache = {
  timestamp: null,
  data: [],     // [{ symbol, name, price, changePercent }]
  lastError: null
};

function formatFromYahoo(list) {
  return SYMBOLS.map(s => {
    const d = list.find(i => i.symbol === s);
    return {
      symbol: s,
      name: d?.shortName ?? null,
      price: d?.regularMarketPrice ?? null,
      changePercent: d?.regularMarketChangePercent ?? null
    };
  });
}

async function fetchFromYahoo() {
  const symbols = SYMBOLS.join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  const res = await axios.get(url, { timeout: 15000 });
  const list = res.data?.quoteResponse?.result;
  if (!list) throw new Error("Yahoo returned no result");
  return formatFromYahoo(list);
}

async function fetchFromFinnhub(key) {
  // Finnhub usually provides quote per symbol; we loop with small delays to avoid bursts.
  const results = [];
  for (const sym of SYMBOLS) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${key}`;
    try {
      const r = await axios.get(url, { timeout: 10000 });
      // Finnhub: r.data.c is current price; r.data.pc is previous close
      const price = (r.data && typeof r.data.c === "number") ? r.data.c : null;
      const changePercent = (r.data && typeof r.data.pc === "number" && typeof r.data.c === "number")
        ? ((r.data.c - r.data.pc) / r.data.pc * 100)
        : null;
      results.push({ symbol: sym, name: null, price, changePercent });
      // small delay to reduce burst chances
      await new Promise(res => setTimeout(res, 200));
    } catch (e) {
      // push null result and continue
      results.push({ symbol: sym, name: null, price: null, changePercent: null });
    }
  }
  return results;
}

async function refreshOnce() {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    let data;
    if (finnhubKey) {
      console.log("stockFetcher: using Finnhub");
      data = await fetchFromFinnhub(finnhubKey);
    } else {
      console.log("stockFetcher: no FINNHUB key, using Yahoo fallback");
      data = await fetchFromYahoo();
    }

    cache = {
      timestamp: new Date().toISOString(),
      data,
      lastError: null
    };
    console.log("stockFetcher: updated cache:", cache.timestamp);
  } catch (err) {
    console.error("stockFetcher: refresh error:", err.message || err);
    cache.lastError = { time: new Date().toISOString(), message: err.message || String(err) };
  }
}

function startScheduler() {
  // Cron expression: every 2 hours at minute 0 -> "0 */2 * * *"
  // Run immediately once, then schedule.
  refreshOnce().catch(e => console.error("initial-refresh-failed", e.message));
  cron.schedule("0 */2 * * *", () => {
    console.log("stockFetcher: running scheduled refresh (every 2 hours)");
    refreshOnce().catch(e => console.error("scheduled-refresh-failed", e.message));
  }, { scheduled: true, timezone: "UTC" }); // use UTC to avoid DST issues; change if you prefer local
}

function getCachedData() {
  return cache;
}

module.exports = { startScheduler, getCachedData, refreshOnce };
