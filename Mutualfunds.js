const express = require("express");
const axios = require("axios");
const router = express.Router();

const MUTUAL_FUNDS = [
  { schemeCode: "118834", name: "Demo Equity Fund" },
  { schemeCode: "118835", name: "Demo Balanced Fund" }
];

router.get("/", async (req, res) => {
  const results = [];

  for (const mf of MUTUAL_FUNDS) {
    try {
      const url = `https://api.mfapi.in/mf/${mf.schemeCode}`;
      const response = await axios.get(url);
      const latest = response.data.data[0];

      results.push({
        schemeCode: mf.schemeCode,
        name: mf.name,
        nav: parseFloat(latest.nav)
      });

    } catch (err) {
      console.error("MF fetch error:", mf.schemeCode, err.message);
      results.push({
        schemeCode: mf.schemeCode,
        name: mf.name,
        nav: null
      });
    }
  }

  res.json(results);
});

module.exports = router;
