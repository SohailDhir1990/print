const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let jobQueue = [];

// Add a print job
app.post("/queue", (req, res) => {
  const { labelData } = req.body;
  if (!labelData) {
    return res
      .status(400)
      .json({ success: false, error: "No labelData provided" });
  }
  const job = { id: Date.now(), labelData };
  jobQueue.push(job);
  res.json({ success: true, job });
});

// Get and remove the next job (worker will poll this)
app.get("/queue", (req, res) => {
  if (jobQueue.length === 0) {
    return res.json({ jobs: [] });
  }
  // For simplicity, return and remove the first job
  const job = jobQueue.shift();
  res.json({ jobs: [job] });
});

app.listen(PORT, () => {
  console.log(`Job Queue API running on http://localhost:${PORT}`);
});
