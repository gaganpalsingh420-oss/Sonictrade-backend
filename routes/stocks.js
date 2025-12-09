const express = require("express");
const axios = require("axios");
const router = express.Router();

const stocks = [
    { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
    { symbol: "MRF.NS", name: "MRF" },
    { symbol: "ADANIGREEN.NS", name: "Adani Green" },
    { symbol: "WIPRO.NS", name: "Wipro" },
    { symbol: "AFFLE.NS", name: "Affle India" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
    { symbol: "RELIANCE.NS", name: "Reliance" }
];

router.get("/", async (req, res) => {
    try {
        const symbols = stocks.map(s => s.symbol).join(",");
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

        const response = await axios.get(url);
        const list = response.data.quoteResponse.result;

        if (!list || list.length === 0) {
            return res.status(500).json({ error: "No data from Yahoo Finance" });
        }

        const finalData = stocks.map(s => {
            const d = list.find(i => i.symbol === s.symbol);
            return {
                symbol: s.symbol,
                name: s.name,
                price: d?.regularMarketPrice ?? null,
                changePercent: d?.regularMarketChangePercent ?? null
            };
        });

        res.json(finalData);

    } catch (err) {
        console.error("Yahoo API Error:", err.message);
        res.status(500).json({ error: "Failed to fetch stock data" });
    }
});

module.exports = router;
