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
        // Yahoo API URL
        const symbols = stocks.map(s => s.symbol).join(",");
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

        const response = await axios.get(url);
        const data = response.data.quoteResponse.result;

        const finalData = stocks.map(stock => {
            const yahoo = data.find(d => d.symbol === stock.symbol);
            return {
                symbol: stock.symbol,
                name: stock.name,
                price: yahoo?.regularMarketPrice || null,
                changePercent: yahoo?.regularMarketChangePercent || null
            };
        });

        res.json(finalData);

    } catch (err) {
        console.error("Error fetching Yahoo data:", err);
        res.status(500).json({ error: "Failed to fetch stock data" });
    }
});

module.exports = router;

