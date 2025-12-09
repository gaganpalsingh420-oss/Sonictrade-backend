const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

let portfolio = {
  balance: 100000,
  stocks: [],
  mutualFunds: []
};

async function getLivePrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const response = await axios.get(url);
  const quote = response.data["Global Quote"];
  if (!quote) return null;
  return parseFloat(quote["05. price"]);
}

async function getLatestNav(schemeCode) {
  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const response = await axios.get(url);
  const latest = response.data.data[0];
  return parseFloat(latest.nav);
}

router.get("/", async (req, res) => {
  const enriched = JSON.parse(JSON.stringify(portfolio));

  for (const stock of enriched.stocks) {
    try {
      const live = await getLivePrice(stock.symbol);
      stock.currentPrice = live ?? stock.buyPrice;
    } catch {
      stock.currentPrice = stock.buyPrice;
    }
  }

  for (const mf of enriched.mutualFunds) {
    try {
      const nav = await getLatestNav(mf.schemeCode);
      mf.currentNav = nav ?? mf.buyNav;
    } catch {
      mf.currentNav = mf.buyNav;
    }
  }

  res.json(enriched);
});

router.post("/buy", (req, res) => {
  const { symbol, price, qty } = req.body;
  if (!symbol || !price || !qty) {
    return res.status(400).json({ error: "Missing fields" });
  }

  portfolio.stocks.push({ symbol, qty, buyPrice: price });
  portfolio.balance -= price * qty;

  res.json({ message: "Stock purchased", portfolio });
});

router.post("/sell", (req, res) => {
  const { index } = req.body;
  if (index == null) {
    return res.status(400).json({ error: "Missing index" });
  }

  const stock = portfolio.stocks[index];
  if (!stock) {
    return res.status(404).json({ error: "Stock not found" });
  }

  const sellPrice = stock.buyPrice;
  portfolio.balance += sellPrice * stock.qty;
  portfolio.stocks.splice(index, 1);

  res.json({ message: "Stock sold", portfolio });
});

router.post("/mf/buy", (req, res) => {
  const { schemeCode, name, nav, units } = req.body;

  if (!schemeCode || !nav || !units) {
    return res.status(400).json({ error: "Missing fields" });
  }

  portfolio.mutualFunds.push({
    schemeCode,
    name,
    units,
    buyNav: nav
  });

  portfolio.balance -= nav * units;

  res.json({ message: "MF purchased", portfolio });
});

router.post("/mf/sell", (req, res) => {
  const { index } = req.body;

  if (index == null) {
    return res.status(400).json({ error: "Missing index" });
  }

  const mf = portfolio.mutualFunds[index];
  if (!mf) {
    return res.status(404).json({ error: "MF not found" });
  }

  const sellNav = mf.buyNav;
  portfolio.balance += sellNav * mf.units;
  portfolio.mutualFunds.splice(index, 1);

  res.json({ message: "MF sold", portfolio });
});

module.exports = router;
