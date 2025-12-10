// routes/stocks.js
const express = require("express");
const router = express.Router();
const { getCachedData } = require("../services/stockFetcher");

// GET /api/stocks
router.get("/", (req, res) => {
  const cache = getCachedData();
  // return cache structure with helpful metadata
  return res.json({
    timestamp: cache.timestamp,
    lastError: cache.lastError,
    stocks: cache.data
  });
});

// Optional route to force-refresh (protected with a simple query key or disabled in production)
router.post("/refresh", async (req, res) => {
  // Simple protection: require ?secret=XXXX or remove this endpoint
  const secret = process.env.REFRESH_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { refreshOnce } = require("../services/stockFetcher");
  try {
    await refreshOnce();
    const cache = getCachedData();
    return res.json({ ok: true, timestamp: cache.timestamp });
  } catch (err) {
    return res.status(500).json({ error: "refresh failed", message: err.message });
  }
});

module.exports = router;
