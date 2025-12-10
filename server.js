const express = require("express");
const cors = require("cors");
require("dotenv").config();

const stocksRoute = require("./routes/stocks");
const portfolioRoute = require("./routes/portfolio");
const mutualFundsRoute = require("./routes/mutualfunds");

const { startScheduler } = require("./services/stockFetcher");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/stocks", stocksRoute);
app.use("/api/portfolio", portfolioRoute);
app.use("/api/mutualfunds", mutualFundsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
  // start the background polling
  startScheduler();
});
