// routes/stocks.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const symbols = ["TATAMOTORS.NS","MRF.NS","ADANIGREEN.NS","WIPRO.NS","AFFLE.NS","HDFCBANK.NS","RELIANCE.NS"];
    const finnhubKey = process.env.FINNHUB_API_KEY;

    if (finnhubKey) {
      // Try Finnhub quote endpoint (one-by-one or adapt)
      console.log("Using Finnhub with key present.");
      const results = [];

      for (const sym of symbols) {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${finnhubKey}`;
          const r = await axios.get(url, { timeout: 10000 });
          // Finnhub returns currentPrice in r.data.c
          results.push({
            symbol: sym,
            name: null,
            price: r.data?.c ?? null,
            changePercent: (r.data && r.data?.pc) ? ((r.data.c - r.data.pc) / r.data.pc * 100) : null
          });
        } catch (innerErr) {
          console.error("Finnhub fetch failed for", sym, "-", innerErr.message);
          if (innerErr.response) console.error("resp status:", innerErr.response.status, "body:", JSON.stringify(innerErr.response.data).slice(0,800));
          results.push({ symbol: sym, name: null, price: null, changePercent: null });
        }
      }

      return res.json(results);
    }

    // FALLBACK: Yahoo Finance bulk quote
    console.log("No FINNHUB_API_KEY, using Yahoo endpoint.");
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    const response = await axios.get(yahooUrl, { timeout: 10000 });

    const list = response.data?.quoteResponse?.result;
    if (!list) {
      console.error("Yahoo returned unexpected data:", JSON.stringify(response.data).slice(0,1000));
      return res.status(500).json({ error: "No data from Yahoo Finance" });
    }

    const finalData = symbols.map(sym => {
      const d = list.find(i => i.symbol === sym);
      return {
        symbol: sym,
        name: d?.shortName ?? null,
        price: d?.regularMarketPrice ?? null,
        changePercent: d?.regularMarketChangePercent ?? null
      };
    });

    return res.json(finalData);

  } catch (err) {
    console.error("Top-level fetch error:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response body:", JSON.stringify(err.response.data).slice(0,2000));
    } else if (err.request) {
      console.error("No response received. Request info:", err.request && err.request._currentUrl);
    } else {
      console.error("Other error:", err);
    }
    return res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

module.exports = router;
