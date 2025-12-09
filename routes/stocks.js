const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

const STOCKS = [
  { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
  { symbol: "MRF.NS",        name: "MRF" },
  { symbol: "ADANIGREEN.NS", name: "Adani Green" },
  { symbol: "WIPRO.NS",      name: "Wipro" },
  { symbol: "AFFLE.NS",      name: "Affle India" },
  { symbol: "HDFCBANK.NS",   name: "HDFC Bank" },
  { symbol: "RELIANCE.NS",   name: "Reliance" }
];

router.get("/", async (req, res) => {
  const results = [];

  for (const stock of STOCKS) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=${API_KEY}`;

    try {
      const response = await axios.get(url);
      const quote = response.data["Global Quote"];

      const price = quote ? parseFloat(quote["05. price"]) : null;
      const changePercent = quote ? quote["10. change percent"] : null;

      results.push({
        symbol: stock.symbol,
        name: stock.name,
        price,
        changePercent
      });

    } catch (err) {
      console.error("Error fetching:", stock.symbol, err.message);
      results.push({
        symbol: stock.symbol,
        name: stock.name,
        price: null,
        changePercent: null
      });
    }
  }

  res.json(results);
});

module.exports = router;
